import { Router } from "express";
import { createFolder, deleteFolder, editFolderName, renderFolderPage } from "../controllers/folderController.js";
const folderRouter = Router();

//CREATE
folderRouter.post("/create", createFolder);
folderRouter.get("/:folderId", renderFolderPage)
folderRouter.post("/edit/:folderId", editFolderName)
folderRouter.post("/delete/:folderId", deleteFolder)

export { folderRouter };