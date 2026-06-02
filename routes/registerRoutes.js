import { Router } from "express";
import { registerUser, renderRegisterPage } from "../controllers/registerController.js";
const registerRouter = Router();

registerRouter.get("/", renderRegisterPage);
registerRouter.post("/", registerUser)

export { registerRouter };