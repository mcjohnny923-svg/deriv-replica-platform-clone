import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import tradesRouter from "./trades";

const router: IRouter = Router();
router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/trades", tradesRouter);

export default router;
