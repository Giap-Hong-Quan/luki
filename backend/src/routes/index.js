import express from "express";
import authRouter from "./authRouter.js";
import userRouter from "./userRouter.js";
import collectionRouter from "./collectionRouter.js";
import categoryRouter from "./categoryRouter.js";
import productRouter from "./productRouter.js";
import cartRouter from "./cartRouter.js";
import orderRouter from "./orderRouter.js";

const router = express.Router();
router.use("/auth", authRouter);
router.use("/user", userRouter);
router.use("/collection", collectionRouter);
router.use("/category", categoryRouter);
router.use("/product", productRouter);
router.use("/cart", cartRouter);
router.use("/order", orderRouter);

export default router;