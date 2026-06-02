import dotenv from 'dotenv';
dotenv.config();
import path from 'node:path';
import { fileURLToPath } from 'url';
import express from 'express';
import session from 'express-session'
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import { prisma } from './lib/prisma.js';
import passport from 'passport';
import './lib/passport.js'
import { indexRouter } from './routes/indexRoutes.js';
import { folderRouter } from './routes/folderRoutes.js';
import { fileRouter } from './routes/fileRoutes.js';
import multer from 'multer';
import { FileTypeError } from './errors/FileTypeError.js';
import { NotAuthError } from './errors/NotAuthError.js';
import { ValidationError } from './errors/ValidationError.js';
import { error } from 'node:console';
import { registerRouter } from './routes/registerRoutes.js';
import { loginRouter } from './routes/loginRoutes.js';
import { logoutRouter } from './routes/logoutRoutes.js';


const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")))

app.use(session({
    cookie: {
        maxAge: 60 * 60 * 1000
    },
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    store: new PrismaSessionStore(prisma, {
        checkPeriod: 2 * 60 * 1000,
        dbRecordIdIsSessionId: true,
        dbRecordIdFunction: undefined,
    })
}));

app.use(passport.session());
app.use(express.urlencoded({ extended: false }))

app.use((req, res, next) => {
    res.locals.user = req.user || null
    res.locals.flash = req.session.flash || {};
    delete req.session.flash;
    next()
})

app.use("/", indexRouter);
app.use("/register", registerRouter);
app.use("/login", loginRouter);
app.use("/logout", logoutRouter);
app.use("/folder", folderRouter);
app.use("/file", fileRouter);

app.listen(process.env.PORT, (e) => {
    if (e) {
        throw error;
    }
    console.log('Server ready at: http://localhost:3000');
});

app.use((err, req, res, next) => {
    console.log(err);
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            req.session.flash = {
                uploadFileErrors: [{ msg: "File is too large (max 10MB)"}]
            }
            return res.redirect("/");
        } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
            req.session.flash = {
                uploadFileErrors: [{ msg: "Only one file allowed" }]
            }
            return res.redirect("/")
        } else {
            req.session.flash = {
                uploadFileErrors: [{ msg: "An error occured when uploading" }]
            }
            return res.redirect("/")
        }
    }

    if (err instanceof FileTypeError) {
        return res.status(400).render("errors", { errors: [{msg: err.message }]})
    }

    if (err instanceof NotAuthError) {
        return res.status(401).render("errors", { errors: [{msg: err.message}]})
    }

    if (err instanceof ValidationError) {
        return res.status(err.status).render("errors", { errors: err.errors})
    }

    res.status(500).json({message: "Internal server error"});
})