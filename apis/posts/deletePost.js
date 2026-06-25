const express = require("express");
const { queryDatabase } = require("../../db.js");
const {
  authMiddleware,
  employerCandidate,
} = require("../../auth/authorisation.js");
const upload = require("../../middleware/uploadPosts.js");
const fs = require("fs");

const router = express.Router();

// Delete Post (/posts/:postId)
router.delete(
  "/:postId",
  authMiddleware,
  employerCandidate,
  async (req, res) => {
    try {
      const { postId } = req.params;

      // Check whether the post belongs to the logged-in user
      const posts = await queryDatabase(
        `
        SELECT
          file_path
        FROM posts
        WHERE
          post_id = ?
          AND user_id = ?
        `,
        [postId, req.user.id],
      );

      if (posts.length === 0) {
        return res.status(404).json({
          message: "Post not found",
        });
      }

      // Delete uploaded file if it exists
      if (posts[0].file_path && fs.existsSync(posts[0].file_path)) {
        fs.unlinkSync(posts[0].file_path);
      }

      // Delete post from database
      await queryDatabase(
        `
        DELETE FROM posts
        WHERE
          post_id = ?
          AND user_id = ?
        `,
        [postId, req.user.id],
      );

      res.status(200).json({
        message: "Post deleted successfully",
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Failed to delete post",
      });
    }
  },
);

module.exports = router;
