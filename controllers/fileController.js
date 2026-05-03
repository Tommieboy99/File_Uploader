import multer from 'multer';
import { prisma } from '../lib/prisma.js';
import { body, matchedData, validationResult } from 'express-validator';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/uploads')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix)
    }
})

const upload = multer({storage: storage});

const validateFileUpload = [
    body("file")
    .custom((_, {req}) => {
        if (!req.file) throw new Error("File is required")
        return true
    } ),

    body("uploadOption")
    .isIn(["noFolder", "newFolder", "selectFolder"]).withMessage("Invalid upload option"),

    body().custom(async (_, { req }) => {
        if (!req.file) return true;

        let folderId;

        if (req.body.uploadOption === "noFolder") {
            const root = await prisma.folder.findFirst({
                where: {
                    userId: req.user.id,
                    isRoot: true
                }
            });

            folderId = root.id;

        } else if (req.body.uploadOption === "selectFolder") {
            folderId = Number(req.body.selectedFolder);

        } else if (req.body.uploadOption === "newFolder") {
            return true;
        }

        const exists = await prisma.file.findFirst({
            where: {
                name: req.file.originalname,
                folderId
            }
        });

        if (exists) throw new Error("Duplicate file name");

        return true;
    }),

    body("newFolderName")
    .if(body("uploadOption").equals("newFolder"))
    .trim()
    .notEmpty().withMessage("Folder name is required")
    .toLowerCase()
    .custom(async (value, { req }) => {
        const folder = await prisma.folder.findUnique({
            where: {
                name_userId: {
                    name: value,
                    userId: req.user.id
                }
            }
        })

        if (folder) throw new Error('Folder name is already taken')
    }),

    body("selectedFolder")
    .if(body("uploadOption").equals("selectFolder"))
    .notEmpty().withMessage("Folder is required")
    .isInt().withMessage("Invalid folder id")
    .custom(async (value, { req }) => {
        const folder = await prisma.folder.findFirst({ 
            where: { id: Number(value), userId: req.user.id }
        });

        if (!folder) throw new Error("Folder does not exist")
    })

]

export const uploadFile = [upload.single('file'), ...validateFileUpload, async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        req.session.fileUploadErrors = errors.array();
        return res.redirect("/")
    }

    const { uploadOption, newFolderName, selectedFolder } = matchedData(req);

    if (uploadOption === "noFolder") {
        const root = await prisma.folder.findFirst({
            where: {
                userId: req.user.id,
                isRoot: true
            }
        })

        await prisma.file.create({
            data: {
                name: req.file.originalname,
                size: req.file.size,
                folderId: root.id
            },
        });

    } else if (uploadOption === "newFolder") {
        await prisma.folder.create({
            data: {
                name: newFolderName,
                userId: req.user.id,
                files: {
                    create: {
                        name: req.file.originalname,
                        size: req.file.size
                    }
                }
            }
        })

    } else if (uploadOption === "selectFolder") {
        await prisma.file.create({
            data: {
                name: req.file.originalname,
                size: req.file.size,
                folderId: Number(selectedFolder)
            }
        })
    }

    res.redirect("/")
}]


