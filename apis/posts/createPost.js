const express = require("express");
const { queryDatabase } = require("../../db.js");
const { authMiddleware, employerCandidate } = require("../../auth/authorisation.js");
const upload = require("../../middleware/uploadPosts.js");

const router = express.Router();

// Create & Publish Post (/posts)
router.post(
  "/",
  authMiddleware,
  employerCandidate,
  upload.single("media"),
  async (req, res) => {
    try {
      const { content } = req.body;

      if (!content && !req.file) {
        return res.status(400).json({
          message: "Post must contain text or a file.",
        });
      }

      let mediaType = "Article";
      let fileName = null;
      let filePath = null;

      // File uploaded
      if (req.file) {
        fileName = req.file.filename;
        filePath = req.file.path;

        if (req.file.mimetype.startsWith("image/")) {
          mediaType = "Image";
        }
        else if (req.file.mimetype.startsWith("video/")) {
          mediaType = "Video";
        }
        else {
          mediaType = "Document";
        }
      }

      const result = await queryDatabase(
        `
        INSERT INTO posts
        (
          user_id,
          content,
          media_type,
          file_name,
          file_path
        )
        VALUES
        (
          ?, ?, ?, ?, ?
        )
        `,
        [
          req.user.id,
          content,
          mediaType,
          fileName,
          filePath,
        ]
      );

      res.status(201).json({
        message: "Post published successfully",
        post_id: result.insertId,
      });

    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Failed to publish post",
      });
    }
  }
);

module.exports = router;