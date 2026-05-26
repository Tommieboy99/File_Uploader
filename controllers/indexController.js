import { prisma } from "../lib/prisma.js"


export const getIndexPage = async (req, res) => {
    if (req.user) {

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

        res.render('dashboard', { folders, rootFiles })
    } else {
        res.render('homepage')
    }
}
