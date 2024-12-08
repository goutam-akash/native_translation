import express from "express";
import bodyParser from "body-parser";

import corsMiddleware from "./middleware/cors.js";
import { createTableIfNotExists } from "./db/initializeDatabase.js";
import translationsRoutes from "./routes/translationsRoutes.js";

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(corsMiddleware);
app.use(express.json());
app.use(bodyParser.json());

// Create the table when the server starts
createTableIfNotExists();

// Route for handling POST requests
app.use("/api", translationsRoutes);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
