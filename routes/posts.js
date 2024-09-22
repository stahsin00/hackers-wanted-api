import 'dotenv/config.js';
import express from 'express';
import { db } from '../services/mysql.js';
import { isAuthenticated } from '../middleware/isAuthenticated.js';

const router = express.Router();

router.post("/", isAuthenticated, async (req, res) => {
  const { title, description, tags, category } = req.body;

  if (!title || !description || !category) {
    return res.status(400).send("Missing required fields.");
  }

  try {
    const post = await db.query(
      "INSERT INTO posts (user_id, title, description, tags, status) VALUES (?, ?, ?, ?, ?)",
      [req.user.id, title, description, tags, 1]
    );

    res.status(201).send({ post });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

router.get('/', async (req, res) => {
  const LIMIT = 5; // TODO: centralize configs

  const offset = parseInt(req.query.offset, 10) || 0;
  const tags = req.query.tags ? req.query.tags.split(",") : [];

  try {
    let query = `
            SELECT posts.*, users.name AS user_name, users.email AS user_email
            FROM posts
            JOIN users ON posts.user_id = users.id
						ORDER BY posts.id DESC
        `;
    let queryParams = [];

    if (tags.length > 0) {  // TODO: tags table?
        query += ' WHERE (';
        query += tags.map(() => 'FIND_IN_SET(?, posts.tags)').join(' OR ');
        query += ')';
        queryParams.push(...tags);
    }

    query += ' LIMIT ? OFFSET ?';
    queryParams.push(LIMIT, offset);

    const posts = await db.query(query, queryParams);

    res.status(200).send({ posts });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/search', async (req, res) => { // TODO: other ways to search?
    const LIMIT = 5; // TODO: centralize configs
  
    const offset = parseInt(req.query.offset, 10) || 0;
    const search = req.query.search || "";
  
    try {
      // TODO: other ways to search?
      let query = `
              SELECT posts.*, users.name AS user_name, users.email AS user_email
              FROM posts
              JOIN users ON posts.user_id = users.id
          `;
      let queryParams = [];
  
      if (search) {
        query += ' WHERE (posts.title LIKE ? OR posts.description LIKE ?)';
        const searchPattern = `%${search}%`;
        queryParams.push(searchPattern, searchPattern);
      }
  
      query += ' LIMIT ? OFFSET ?';
      queryParams.push(LIMIT, offset);
  
      const posts = await db.query(query, queryParams);
  
      res.status(200).send({ posts });
    } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
    }
  });

router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    return res.status(400).send('Invalid ID format');
  }

  try {
    const result = await db.query(
      `SELECT posts.*, users.name AS user_name, users.email AS user_email, users.profile_picture AS user_picture
             FROM posts 
             JOIN users ON posts.user_id = users.id 
             WHERE posts.id = ?`,
      [id]
    );

    if (result.length === 0) {
      return res.status(404).send('Post not found.');
    }

    const post = result[0];

    res.status(200).json({ post });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

router.patch("/:id", isAuthenticated, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { title, description, tags, category, status } = req.body;

  if (isNaN(id)) {
    return res.status(400).send("Invalid ID format");
  }

  if (!title || !description || !category) {
    return res.status(400).send("Missing required fields.");
  }

  try {
    const result = await db.query("SELECT * FROM posts WHERE id = ?", [id]);

    if (result.length === 0) {
      return res.status(404).send("Post not found.");
    }

    const post = result[0];

    if (post.user_id !== req.user.id) {
      return res.status(403).send("Unauthorized.");
    }

    await db.query(
      `UPDATE posts 
             SET title = ?, description = ?, tags = ?, status = ? 
             WHERE id = ? AND user_id = ?`,
      [title, description, tags, status ?? post.status, id, req.user.id]
    );

    res.status(200).send("Post updated.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

router.delete("/:id", isAuthenticated, async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    return res.status(400).send("Invalid ID format");
  }

  try {
    const result = await db.query(
      "DELETE FROM posts WHERE id = ? AND user_id = ?",
      [id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).send("Post not found.");
    }

    res.status(200).send("Post deleted.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

export default router;
