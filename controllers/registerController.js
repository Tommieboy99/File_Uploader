import { body, matchedData, validationResult } from 'express-validator';
import { prisma } from "../lib/prisma.js";
import bcrypt from 'bcryptjs';
import { Prisma } from "../generated/prisma/index.js";

export const renderRegisterPage = (req, res) => {
    if (req.user) {
        return res.redirect("/");
    } else {
        res.render("register")
    }
}

const validateUser = [
    body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Invalid email")
    .isLength({ max: 254 }).withMessage("Email is too long (max. 254 characters)")
    .normalizeEmail()
    .custom(async value => {
        const user = await prisma.user.findUnique({ where: { email: value } })
        if (user) throw new Error("E-mail already in use");
        return true;
    }),

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

export const registerUser = [...validateUser, 
    async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        req.session.flash = {
            errors: errors.array(),
        }

        return res.redirect("/register");
    }

    const { email, password } = matchedData(req);

    const hashedPassword = await bcrypt.hash(password, 10);

    try {

        await prisma.user.create({
            data: { 
                email, 
                password: hashedPassword,

                folders: {
                    create: {
                        name: "root",
                        isRoot: true
                    }
                }
            },
        });

    } catch (err) {

        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            if (e.code === 'P2002') {
                req.session.flash = {
                    errors: [{ msg: "E-mail already in use" }]
                }

                return res.redirect("/register");
            }
        }

        return next(err);
    }

    req.session.flash = {
        success: "Account created succesfully"
    }

    return res.redirect("/login")
}]