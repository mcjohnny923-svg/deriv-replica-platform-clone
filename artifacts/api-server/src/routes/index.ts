import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import tradesRouter from "./trades";
import partnersRouter from "./partners";
import paymentsRouter from "./payments";

const router: IRouter = Router();
router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/trades", tradesRouter);
router.use("/partners", partnersRouter);
router.use("/payments", paymentsRouter);

export default router;
