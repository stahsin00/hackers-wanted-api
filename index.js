import "dotenv/config.js";
import express from "express";

const port = process.env.PORT || 1234;
const app = express();

app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
