import { Router } from "express";
import { authenticateUser, renderLoginPage } from "../controllers/loginController.js";

const loginRouter = Router();

loginRouter.get("/", renderLoginPage);
loginRouter.post("/", authenticateUser);

export { loginRouter };