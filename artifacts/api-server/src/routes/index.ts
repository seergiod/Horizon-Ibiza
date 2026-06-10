import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth.js";
import reservasRouter from "./reservas.js";
import whatsappRouter from "./whatsapp.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(reservasRouter);
router.use(whatsappRouter);

export default router;
