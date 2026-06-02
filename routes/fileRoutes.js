import { Router } from "express";
import { fileUpload, renderFilePage } from "../controllers/fileController.js";

const fileRouter = Router();

fileRouter.post('/upload', fileUpload);
fileRouter.get('/:fileId', renderFilePage)

export { fileRouter };