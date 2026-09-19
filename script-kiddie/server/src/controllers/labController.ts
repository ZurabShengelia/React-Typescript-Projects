import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthenticatedRequest } from "../middlewares/auth";
import { ApiError } from "../utils/ApiError";
import { acceptLabAup, listLabs, startLabAttempt, submitLabFlag, getLabConsent, revealHintForAttempt } from "../services/labService";

export const getLabs = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const labs = await listLabs();
  const consent = await getLabConsent(req.auth!.userId);
  res.json({ success: true, data: labs.map((lab) => ({ ...lab, acceptedAup: Boolean(consent) })) });
});

export const acceptAup = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await acceptLabAup(req.auth!.userId);
  res.json({ success: true, data: { accepted: true } });
});

export const startLab = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await startLabAttempt(req.auth!.userId, req.params.slug);
    res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof Error && error.message === "Lab acceptance required") {
      throw ApiError.forbidden("You must accept the simulated environment policy before starting a lab.");
    }
    if (error instanceof Error && error.message === "Lab not found") {
      throw ApiError.notFound("Lab not found");
    }
    throw error;
  }
});

export const revealHint = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const index = Number(req.params.hintIndex ?? "");
  const result = await revealHintForAttempt(req.auth!.userId, req.params.slug, index);
  res.json({ success: true, data: result });
});

export const submitFlag = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await submitLabFlag(req.auth!.userId, req.params.slug, req.body.flag || "");
  if (!result.completed) {
    return res.json({ success: true, data: { completed: false, message: result.message } });
  }

  res.json({ success: true, data: { completed: true, message: result.message, score: result.score } });
});
