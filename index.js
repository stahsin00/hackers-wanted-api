import "dotenv/config.js";
import express from "express";
import { connectToMySQL } from "./services/mysql.js";

const port = process.env.PORT || 1234;
const app = express();

await connectToMySQL();

app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
