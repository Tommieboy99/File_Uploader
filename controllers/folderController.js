import { Prisma } from "../generated/prisma/index.js"
import { prisma } from "../lib/prisma.js"
import { body, validationResult } from "express-validator";

const validateCreateFolder = [
    body("folderName")
    .trim()
    .notEmpty().withMessage("ERROR: Folder name is required")
    .custom(async (value, { req }) => {
        const folder = await prisma.folder.findUnique({
            where: {
                name_userId: {
                    name: value,
                    userId: req.user.id
                }
            }
        })

        if (folder) throw new Error('ERROR: Folder name is already taken')
    })
]

export const createFolder = [...validateCreateFolder, async (req, res) => {
    
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).redirect("/")
    }
    
    try {
        await prisma.folder.create({
            data: {
                name: req.body.folderName,
                userId: req.user.id,
            },
        })

        return res.redirect("/")

    } catch (e) {
        console.log(e);
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
            if (e.code === "P2002") {
                req.session.createFolderError = "Folder name already exists";
                return res.redirect("/");
            }
        } 

        req.session.createFolderError = "Something went wrong";
        return res.redirect("/");
    } 
}]

export const renderFolderPage = async (req, res) => {
    const folder = await prisma.folder.findUnique({
        where: {
            id: Number(req.params.folderId)
        },
        include: { files: true }
    })

    console.log(folder);


    res.render("folder", { folder, user: req.user})
}

export const updateFolderName = async (req, res) => {
    await prisma.folder.update({
        where: { id: Number(req.params.folderId) },
        data: { name: req.body.folderName },
    });

    res.redirect(`/folder/${req.params.folderId}`);
}

export const deleteFolder = async (req, res) => {
    await prisma.folder.delete({
        where: {
            id: Number(req.params.folderId),
        },
    })

    res.redirect("/");
}