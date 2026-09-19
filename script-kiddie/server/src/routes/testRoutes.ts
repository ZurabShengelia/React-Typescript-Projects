import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { submissionLimiter } from "../middlewares/rateLimiters";
import { idParamSchema, submitTestSchema } from "../validators/testValidators";
import { listTests, getTest, startTest, submitTest } from "../controllers/testController";

const router = Router();

router.get("/", requireAuth, listTests);
router.get("/:id", requireAuth, validate(idParamSchema), getTest);
router.post("/:id/start", requireAuth, submissionLimiter, validate(idParamSchema), startTest);
router.post("/:id/submit", requireAuth, submissionLimiter, validate(submitTestSchema), submitTest);

export default router;
