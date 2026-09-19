import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { idParamSchema } from "../validators/testValidators";
import { listAttempts, getAttempt } from "../controllers/attemptController";

const router = Router();

router.get("/", requireAuth, listAttempts);
router.get("/:id", requireAuth, validate(idParamSchema), getAttempt);

export default router;
