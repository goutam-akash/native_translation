import pool from "../db/pool.js";
import { Parser } from "json2csv";

export const createTranslation = async (req, res) => {
  const {
    original_message,
    translated_message,
    language,
    model,
    ranking,
    rating,
    classification,
  } = req.body;

  if (!original_message || !translated_message || !language || !model) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO translations (original_message, translated_message, language, model, ranking, rating, classification) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [
        original_message,
        translated_message,
        language,
        model,
        ranking,
        rating,
        classification,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Database insertion error:", error);
    res.status(500).json({ error: "Database insertion error" });
  }
};

export const exportTranslationsToCSV = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM translations");
    const jsonData = result.rows;
    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(jsonData);
    res.header("Content-Type", "text/csv");
    res.attachment("output_file.csv");
    res.send(csv);
  } catch (error) {
    console.error("Error exporting to CSV:", error);
    res.status(500).send("Internal Server Error");
  }
};
