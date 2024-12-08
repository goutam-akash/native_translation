import express from "express";
import {
  createTranslation,
  exportTranslationsToCSV,
} from "../controllers/translationsController.js";
const router = express.Router();

router.post("/translations", createTranslation);
router.get("/export", exportTranslationsToCSV);

export default router;
