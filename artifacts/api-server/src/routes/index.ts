import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import tradesRouter from "./trades";
import partnersRouter from "./partners";
import paymentsRouter from "./payments";
import adminRouter from "./admin";
import accountRouter from "./account";
import verificationRouter from "./verification";
import verificationAdminRouter from "./verification-admin";
import partnerWithdrawalsRouter from "./partner-withdrawals";
import marketsRouter from "./markets";

const router: IRouter = Router();
router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/account", accountRouter);
router.use("/trades", tradesRouter);
router.use("/partners", partnersRouter);
router.use("/payments", paymentsRouter);
router.use("/admin/partner-withdrawals", partnerWithdrawalsRouter);
router.use("/admin/verification", verificationAdminRouter);
router.use("/verification", verificationRouter);
router.use("/admin", adminRouter);
router.use("/markets", marketsRouter);

export default router;
