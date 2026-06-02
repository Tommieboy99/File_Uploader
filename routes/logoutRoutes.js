import { Router } from "express";
import { logoutUser } from "../controllers/logoutController.js";
const logoutRouter = Router();

logoutRouter.get("/", logoutUser);

export { logoutRouter };