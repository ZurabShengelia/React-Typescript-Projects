import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { idParamSchema } from "../validators/testValidators";
import { listCategories, getCategory } from "../controllers/categoryController";

const router = Router();

router.get("/", requireAuth, listCategories);
router.get("/:id", requireAuth, validate(idParamSchema), getCategory);

export default router;
