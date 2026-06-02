export const getSignUpPage = async (req, res, next) => {
    res.render("sign-up")
}

import { body, matchedData, validationResult } from 'express-validator';
import { prisma } from "../lib/prisma.js";
import bcrypt from 'bcryptjs';
import passport from "passport";

const validateUser = [
    body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Invalid email")
    .isLength({ max: 254 }).withMessage("Email is too long (max. 254 characters)")
    .normalizeEmail(),

    body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 8, max: 128 }).withMessage("Password must be between 8 and 128 characters"),

    body('confirmPassword')
    .notEmpty().withMessage("Confirm password is required")
    .custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Passwords do not match');
        }
        return true;
    }),
]

export const signUpUser = [...validateUser, 
    async (req, res, next) => {
    const errors = validationResult(req);
    console.log(errors);

    if (!errors.isEmpty()) {
        return res.status(400).render("sign-up", {
            errors: errors.array(),
        });
    }

    const { email, password } = matchedData(req);

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        await prisma.user.create({
            data: { email, password: hashedPassword },
        });
    } catch (err) {
        return res.status(400).render("sign-up", {
            errors: [{ msg: "Email already in use" }],
        });
    }

    res.redirect("/sign-in")
}]

export const getSignInPage = (req, res) => {
    res.render("sign-in")
}

export const signInUser = passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/sign-in"
})

export const logOutUser = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }

    res.redirect("/");
  });
};

import multer from 'multer'

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/uploads')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix)
    }
})

const upload = multer({ storage: storage });

export const uploadFile = [upload.single("file"), async (req, res) => {
        console.log(req.file);
    console.log(req.body);
    await prisma.file.create({
        data: {
            name: req.file.originalname,
            size: req.file.size,
            folderId: 4,
        }
    })
}]

export const createFolder = async (req, res) => {
    await prisma.folder.create({
        data: {
            name: req.body.name,
            userId: req.user.id,
        },
    }) 

    res.redirect("/")
}

export const getHomePage = async (req, res, next) => {
    if (req.user) {
        req.user.folders = await prisma.folder.findMany({
            where: { userId: req.user.id },
            include: { files: true }
        })
    }

    res.render("index", { user: req.user, files: null })
}

export const deleteFolder = async (req, res) => {
    await prisma.folder.delete({
        where: { id: Number(req.params.id) }
    })
}

export const editFolder = async (req, res) => {
    await prisma.folder.update({
        where: { id: Number(req.params.id) },
        data: { name: req.body.name },
    })
}

export const getFolderFiles = async (req, res) => {
  const folderId = Number(req.params.folderId);

  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    include: { files: true }
  });

      if (req.user) {
        req.user.folders = await prisma.folder.findMany({
            where: { userId: req.user.id },
            include: { files: true }
        })
    }

  if (!folder) {
    return res.status(404).send("Folder not found");
  }

  res.render("index", { user: req.user, files: folder.files });
};