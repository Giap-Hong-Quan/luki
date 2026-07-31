import express from "express"
import { signinController, signupController,sendOtpController, verifyOtpController, loginGoogleController, getProfileController } from "../controllers/authController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import { signupSchema, signinSchema } from "../validators/authZod.js";
const authRouter =express.Router();
authRouter.post("/signup",validate(signupSchema),signupController);
authRouter.post("/signin",validate(signinSchema),signinController)
authRouter.post("/sendOtp",sendOtpController)
authRouter.post("/verifyOTp",verifyOtpController)
authRouter.post("/login-gg",loginGoogleController)
authRouter.get("/profile",verifyToken,getProfileController)
export default authRouter;