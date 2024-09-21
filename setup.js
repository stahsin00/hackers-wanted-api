import "dotenv/config.js";

import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

import { connectToMySQL, db } from "./services/mysql.js";

// Convert __dirname to work in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const schemaPath = path.join(__dirname, "db", "schema.sql");
const schema = fs.readFileSync(schemaPath, "utf-8");

const queries = schema
  .split(";")
  .map((query) => query.trim())
  .filter((query) => query.length);

const setup = async () => {
  await connectToMySQL();

  try {
    for (const query of queries) {
      await db.query(query);
    }

    console.log("Database setup completed");
  } catch (err) {
    console.error("Database setup failed:", err);
  } finally {
    db.end((err) => {
      if (err) {
        console.error("Error closing the database connection:", err);
      } else {
        console.log("Database connection closed");
      }
    });
  }
};

setup();
