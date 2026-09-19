import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { z } from "zod";
import { getLabs, acceptAup, startLab, revealHint, submitFlag } from "../controllers/labController";
import { execLabCommand } from "../controllers/labRuntimeController";

const startLabSchema = z.object({
  body: z.any(),
  query: z.any(),
  params: z.object({ slug: z.string().min(1) }),
});

const submitFlagSchema = z.object({
  body: z.object({ flag: z.string().min(1).max(256) }),
  query: z.any(),
  params: z.object({ slug: z.string().min(1) }),
});

const router = Router();

router.get("/", requireAuth, getLabs);
router.post("/accept-aup", requireAuth, acceptAup);
router.post("/:slug/start", requireAuth, validate(startLabSchema), startLab);
router.post("/:slug/hints/:hintIndex/reveal", requireAuth, revealHint);
router.post("/:slug/submit-flag", requireAuth, validate(submitFlagSchema), submitFlag);
router.post("/:slug/exec", requireAuth, execLabCommand);

export default router;
