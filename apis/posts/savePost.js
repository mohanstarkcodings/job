const express = require("express");
const { queryDatabase } = require("../../db.js");
const {
  authMiddleware,
  employerCandidate,
} = require("../../auth/authorisation.js");
const upload = require("../../middleware/uploadPosts.js");

const router = express.Router();

// Save Post (/posts/:postId/save)
router.post(
  "/:postId/save",
  authMiddleware,
  employerCandidate,
  async (req, res) => {
    try {
      const { postId } = req.params;

      // Check whether the post exists
      const posts = await queryDatabase(
        `
        SELECT post_id
        FROM posts
        WHERE post_id = ?
        `,
        [postId],
      );

      if (posts.length === 0) {
        return res.status(404).json({
          message: "Post not found",
        });
      }

      // Check whether the post is already saved
      const savedPost = await queryDatabase(
        `
        SELECT saved_post_id
        FROM saved_posts
        WHERE
          user_id = ?
          AND post_id = ?
        `,
        [req.user.id, postId],
      );

      if (savedPost.length > 0) {
        return res.status(409).json({
          message: "Post already saved",
        });
      }

      // Save post
      await queryDatabase(
        `
        INSERT INTO saved_posts
        (
          user_id,
          post_id
        )
        VALUES
        (
          ?, ?
        )
        `,
        [req.user.id, postId],
      );

      res.status(201).json({
        message: "Post saved successfully",
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Failed to save post",
      });
    }
  },
);

// View Saved Posts (/posts/savedPosts)
router.get("/", authMiddleware, employerCandidate, async (req, res) => {
  try {
    const savedPosts = await queryDatabase(
      `
        SELECT
          sp.saved_post_id,
          sp.saved_at,

          p.post_id,
          p.content,
          p.media_type,
          p.file_name,
          p.file_path,
          p.created_at,

          u.user_id,
          u.email,
          u.role

        FROM saved_posts sp

        INNER JOIN posts p
          ON sp.post_id = p.post_id

        INNER JOIN users u
          ON p.user_id = u.user_id

        WHERE sp.user_id = ?

        ORDER BY sp.saved_at DESC
        `,
      [req.user.id],
    );

    res.status(200).json(savedPosts);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch saved posts",
    });
  }
});

module.exports = router;
