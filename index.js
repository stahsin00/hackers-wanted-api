import "dotenv/config.js";
import express from "express";
import session from "express-session";
import passport from "passport";
import authRouter from "./routes/auth.js";
import { connectToMySQL } from "./services/mysql.js";

const port = process.env.PORT || 1234;
const app = express();

// TODO: cors and logger

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  // TODO use redis as store
  cookie: { 
    secure: false
  }
}));

passport.authenticate("session")

app.use("/auth", authRouter);

await connectToMySQL();

app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
