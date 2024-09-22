import "dotenv/config.js";

import { promisify } from "util";
import mysql from "mysql";

export let db;

export const connectToMySQL = async () => {
  db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  });

  const connect = promisify(db.connect).bind(db);
  db.query = promisify(db.query);

  try {
    await connect();
    console.log("Connected to MySQL");
  } catch (err) {
    console.error("Error connecting to MySQL:", err);
    db.end();
  }
};
