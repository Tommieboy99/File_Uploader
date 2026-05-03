import { prisma } from "../lib/prisma.js"


export const getIndexPage = async (req, res) => {
    if (req.user) {
        const createFolderErrors = req.session.createFolderErrors || null
        const fileUploadErrors = req.session.fileUploadErrors || null
        delete req.session.createFolderErrors
        delete req.session.fileUploadErrors

        const folders =  await prisma.folder.findMany({
            where: { userId: req.user.id, isRoot: false }
        })

        const rootFiles = await prisma.file.findMany({
            where: {
                folder: {
                    userId: req.user.id,
                    isRoot: true
                }
            }
        })

        res.render('dashboard', { user: req.user, folders, rootFiles, createFolderErrors, fileUploadErrors })
    } else {
        res.render('homepage', { user: null })
    }
}
