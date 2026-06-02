import { ValidationError } from "../errors/ValidationError.js";
import { Prisma } from "../generated/prisma/index.js"
import { prisma } from "../lib/prisma.js"
import { body, matchedData, validationResult } from "express-validator";

const validateFolderName = [
    body("folderName")
    .trim()
    .notEmpty().withMessage("Folder name is required")
    .custom(async (value, { req }) => {
        const folder = await prisma.folder.findUnique({
            where: {
                name_userId: {
                    name: value,
                    userId: req.user.id
                }
            }
        })

        if (folder) throw new Error('You already have a folder with this name')
    })
]

export const createFolder = [...validateFolderName, async (req, res, next) => {
    
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        req.session.flash = {
            createFolderErrors: errors.array()
        }
        console.log(errors.array());
        return res.redirect("/")
    }

    const { folderName } = matchedData(req);

    try {
        await prisma.folder.create({
            data: {
                name: folderName,
                userId: req.user.id,
            },
        })

        return res.redirect("/")

    } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
            if (e.code === "P2002") {
                req.session.flash = { 
                    createFolderErrors: [{ msg: 'You already have a folder with this name'}] 
                };
                return res.redirect("/");
            }
        } 

        return next(e);
    } 
}]

export const renderFolderPage = async (req, res) => {
    const folder = await prisma.folder.findUnique({
        where: {
            id: Number(req.params.folderId)
        },
        include: { files: true }
    })


    res.render("folder", { folder, user: req.user})
}

export const editFolderName = [...validateFolderName, async (req, res, next) => {

    const errors = validationResult(req);
    console.log(errors);

    if (!errors.isEmpty()) {
        return next(new ValidationError(errors.array())) 
    }

    const { folderName } = matchedData(req);

    await prisma.folder.update({
        where: { id: Number(req.params.folderId) },
        data: { name: folderName },
    });

    res.redirect(`/folder/${req.params.folderId}`);
}]

export const deleteFolder = async (req, res) => {
    await prisma.folder.delete({
        where: {
            id: Number(req.params.folderId),
        },
    })

    res.redirect("/");
}