import { Router, type IRouter } from "express";
import healthRouter from "./health";
import graderRouter from "./grader";

const router: IRouter = Router();

router.use(healthRouter);
router.use(graderRouter);

export default router;
