import { Router, type IRouter, type Request, type Response } from "express";
import { getLivePrice } from "../lib/live-price";

const router: IRouter = Router();

router.get("/tick", (req: Request, res: Response) => {
  const symbol = String(req.query.symbol ?? "");
  if (!symbol) {
    res.status(400).json({ error: "symbol query param required" });
    return;
  }
  const { price, digit } = getLivePrice(symbol);
  res.json({ symbol, price, digit });
});

export default router;
