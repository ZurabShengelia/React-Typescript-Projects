import { Router } from "express";
import { validate } from "../middlewares/validate";
import { contactLimiter } from "../middlewares/rateLimiters";
import { contactSchema } from "../validators/contactValidators";
import { sendContactMessage } from "../controllers/contactController";

const router = Router();

router.post("/", contactLimiter, validate(contactSchema), sendContactMessage);

export default router;
