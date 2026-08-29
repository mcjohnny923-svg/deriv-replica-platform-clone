import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import tradesRouter from "./trades";
import partnersRouter from "./partners";
import paymentsRouter from "./payments";
import adminRouter from "./admin";

const router: IRouter = Router();
router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/trades", tradesRouter);
router.use("/partners", partnersRouter);
router.use("/payments", paymentsRouter);
router.use("/admin", adminRouter);

export default router;
