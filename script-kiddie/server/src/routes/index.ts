import { Router } from "express";
import authRoutes from "./authRoutes";
import categoryRoutes from "./categoryRoutes";
import testRoutes from "./testRoutes";
import attemptRoutes from "./attemptRoutes";
import dashboardRoutes from "./dashboardRoutes";
import profileRoutes from "./profileRoutes";
import labRoutes from "./labRoutes";
import chatRoutes from "./chatRoutes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/categories", categoryRoutes);
router.use("/tests", testRoutes);
router.use("/attempts", attemptRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/profile", profileRoutes);
router.use("/labs", labRoutes);
router.use("/chat", chatRoutes);

export default router;
