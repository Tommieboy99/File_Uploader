import { Router } from "express";
import * as controller from '../controllers/index.js'

const router = Router();

router.get("/sign-up", controller.getSignUpPage);
router.post("/sign-up", controller.signUpUser);



router.get("/log-out", controller.logOutUser)

router.post("/upload", controller.uploadFile)

router.post("/createFolder", controller.createFolder)
router.post("/deleteFolder/:id", controller.deleteFolder)
router.post("/editFolder/:id", controller.editFolder)

router.get("/:folderId", controller.getFolderFiles)


router.get("/", controller.getHomePage);

export { router };