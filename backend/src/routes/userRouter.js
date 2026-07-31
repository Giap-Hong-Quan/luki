import express from "express";
import { createUserController, deleteUserByIdController, getAllUserController } from "../controllers/userController.js";
import { verifyToken, authorizeRoles } from "../middlewares/authMiddleware.js";

const userRouter = express.Router();
userRouter.get("/", verifyToken, authorizeRoles("admin"), getAllUserController);
userRouter.delete("/:id", verifyToken, authorizeRoles("admin"), deleteUserByIdController);
userRouter.post("/", verifyToken, authorizeRoles("admin"), createUserController);

export default userRouter;