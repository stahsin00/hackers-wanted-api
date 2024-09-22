import "dotenv/config.js";
import express from "express";
import { db } from "../services/mysql.js";

const router = express.Router();

const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    return res.status(401).json({ message: 'Unauthorized.' });
};

router.post('/', isAuthenticated, async (req, res) => {
    // TODO: handle tags
    const { title, description, tags } = req.body;

    if (!title || !description || !tags) {
        return res.status(400).send("Missing required fields.");
    }

    try {
        const post = await db.query(
            "INSERT INTO posts (user_id, title, description) VALUES (?, ?, ?)",
            [req.user.id, title, description]
        );

        res.status(201).send({ post });

    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

router.get('/', (req, res) => {
    // TODO
});

router.get("/:id", async (req, res) => {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
        return res.status(400).send("Invalid ID format");
    }

    try {
        const result = await db.query(
            `SELECT posts.*, users.name, users.email
             FROM posts 
             JOIN users ON posts.user_id = users.id 
             WHERE posts.id = ?`, 
             [id]
        );

        if (result.length === 0) {
            return res.status(404).send("Post not found.");
        }

        const post = result[0];

        res.status(200).json({ post });

    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

router.patch("/:id", isAuthenticated, async (req, res) => {
    // TODO: handle tags
    const id = parseInt(req.params.id, 10);
    const { title, description, tags, status } = req.body;

    if (isNaN(id)) {
        return res.status(400).send("Invalid ID format");
    }

    if (!title || !description || !tags) {
        return res.status(400).send("Missing required fields.");
    }

    try {
        const result = await db.query(
            "SELECT * FROM posts WHERE id = ?", 
            [id]
        );

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
            [title, description, tags, status || post.status, id, req.user.id]
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