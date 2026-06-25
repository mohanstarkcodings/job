const express = require("express");
const { queryDatabase } = require("../../db.js");
const {
  authMiddleware,
  employerCandidate,
} = require("../../auth/authorisation.js");

const router = express.Router();

// View My Posts (/posts/my)
router.get("/my", authMiddleware, employerCandidate, async (req, res) => {
  try {
    const posts = await queryDatabase(
      `
        SELECT
          post_id,
          content,
          media_type,
          file_name,
          file_path,
          created_at,
          updated_at
        FROM posts
        WHERE user_id = ?
        ORDER BY created_at DESC
        `,
      [req.user.id],
    );

    res.status(200).json(posts);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch posts",
    });
  }
});

// View Specific Post (/posts/:postId)
router.get("/:postId", authMiddleware, async (req, res) => {
  try {
    const { postId } = req.params;

    const posts = await queryDatabase(
      `
        SELECT
          p.post_id,
          p.content,
          p.media_type,
          p.file_name,
          p.file_path,
          p.created_at,
          p.updated_at,
          u.user_id,
          u.role,
          u.email
        FROM posts p
        INNER JOIN users u
          ON p.user_id = u.user_id
        WHERE p.post_id = ?
        `,
      [postId],
    );

    if (posts.length === 0) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    res.status(200).json(posts[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch post",
    });
  }
});

// View All Posts (/posts)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const posts = await queryDatabase(
      `
        SELECT
          p.post_id,
          p.content,
          p.media_type,
          p.file_name,
          p.file_path,
          p.created_at,
          u.user_id,
          u.role,
          u.email
        FROM posts p
        INNER JOIN users u
          ON p.user_id = u.user_id
        ORDER BY p.created_at DESC
        `,
    );

    res.status(200).json(posts);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch posts",
    });
  }
});

module.exports = router;