import "dotenv/config.js";

import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

import mockUsers from "./data/mock-users.json" assert { type: "json" };
import mockPosts from "./data/mock-posts.json" assert { type: "json" };

import { connectToMySQL, db } from "./services/mysql.js";

const setup = async () => {
  await connectToMySQL();

  try {

    await createTables();
    const userIds = await insertUsers(mockUsers);
    await insertPosts(mockPosts, userIds);

    console.log("Database setup completed");

  } catch (err) {

    console.error("Database setup failed:", err);

  } finally {
    await db.end();
  }
};

const createTables = async() => {
  try {
    // Convert __dirname to work in ES modules
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    const schemaPath = path.join(__dirname, "db", "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf-8");

    const queries = schema
      .split(";")
      .map((query) => query.trim())
      .filter((query) => query.length);

    for (const query of queries) {
      await db.query(query);
    }

    console.log("Tables created.");

  } catch (err) {
    console.error("Error creating tables:", err);
    throw err;
  }
}

const insertUsers = async (users) => {
  try {
    const userIds = [];
    for (const user of users) {

      const result = await db.query(
        "INSERT INTO users (name, email, profile_picture) VALUES (?, ?, ?)",
        [user.name, user.email, user.profile_picture]
      );

      userIds.push(result.insertId);

    }

    console.log("User data inserted successfully!");
    return userIds;
  } catch (err) {
    console.error("Error inserting data: ", err);
    throw err;
  }
};

const insertPosts = async (posts, userIds) => {

  try {
    for (const post of posts) {

      const randomUserId = userIds[Math.floor(Math.random() * userIds.length)];

      await db.query(
        "INSERT INTO posts (title, description, tags, status, user_id) VALUES (?, ?, ?, ?, ?)",
        [post.title, post.description, post.tags, post.status, randomUserId]
      );

    }

    console.log("Post data inserted successfully!");
  } catch (err) {
    console.error("Error inserting data: ", err);
    throw err;
  }
};

setup();
