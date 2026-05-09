import dotenv from 'dotenv';
dotenv.config();
import multer from 'multer';
import { prisma } from '../lib/prisma.js';
import { body, matchedData, validationResult } from 'express-validator';
import { v2 as cloudinary } from 'cloudinary'
import { FileTypeError } from '../errors/FileTypeError.js';
import { isAuthenticated } from './authController.js';
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const uploadImage = async (imagePath) => {
    const options = {
        folder: "fisto",
        public_id: crypto.randomUUID()
    }

    try {
        const result = await cloudinary.uploader.upload(imagePath, options);
        return result;
    } catch (error) {
        console.log(error);
    } finally {
        fs.unlink(imagePath, (err) => {
            if (err) console.log(err);
        })
    }
}

const upload = multer({
    dest: "uploads/",
    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 1
    }, 
    fileFilter: (req, file, cb) => {
        const allowed = ["image/jpeg", "image/png", "image/webp"];

        if (!allowed.includes(file.mimetype)) {
            return cb(new FileTypeError('Only images allowed'), false)
        }

        cb(null, true)
    }
})

const validateUpload = [
    body("uploaded_file")
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

        if (exists) throw new Error("A file with this name already exists");

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

        if (folder) throw new Error('A folder with this name already exists')
    }),

    body("selectedFolder")
    .if(body("uploadOption").equals("selectFolder"))
    .notEmpty().withMessage("Folder is required")
    .isInt().withMessage("Invalid folder id")
    .custom(async (value, { req }) => {
        const folder = await prisma.folder.findFirst({ 
            where: { id: Number(value), userId: req.user.id }
        });

        if (!folder) throw new Error("The selected folder does not exist")
    })

]

export const fileUpload = [isAuthenticated, upload.single('uploaded_file'), ...validateUpload, async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).render("errors", { errors: errors.array() })
    }
    const result = await uploadImage(req.file.path)
    const publicId = result.public_id;
    const url = result.secure_url;

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
                public_id: publicId,
                url: url,
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
                        size: req.file.size,
                        public_id: publicId,
                        url: url
                    }
                }
            }
        })

    } else if (uploadOption === "selectFolder") {
        await prisma.file.create({
            data: {
                name: req.file.originalname,
                size: req.file.size,
                public_id: publicId,
                url: url,
                folderId: Number(selectedFolder)
            }
        })
    }

}]

export const renderFilePage = async (req, res) => {
    const file = await prisma.file.findUnique({
        where: {
            id: Number(req.params.fileId)
        }
    })

    res.render("file", { file, user: req.user})
}


