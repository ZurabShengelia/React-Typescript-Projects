import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthenticatedRequest } from "../middlewares/auth";
import { getDashboardSummary } from "../services/dashboardService";

export const getDashboard = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const summary = await getDashboardSummary(req.auth!.userId);
  res.json({ success: true, data: summary });
});
