import "dotenv/config.js";
import express from "express";
import session from "express-session";
import passport from "passport";
import cors from "cors";
import authRouter from "./routes/auth.js";
import postsRouter from "./routes/posts.js";
import { connectToMySQL } from "./services/mysql.js";

const port = process.env.PORT || 1234;
const app = express();

// TODO: use a logger

app.use(
  cors({
    credentials: true,
    origin: process.env.FRONTEND_URI,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    // TODO use redis as store
    cookie: {
      secure: false,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/auth", authRouter);
app.use("/posts", postsRouter);

await connectToMySQL();

app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
