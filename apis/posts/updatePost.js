const express = require("express");
const { queryDatabase } = require("../../db.js");
const {
  authMiddleware,
  employerCandidate,
} = require("../../auth/authorisation.js");
const upload = require("../../middleware/uploadPosts.js");
const fs = require("fs");

const router = express.Router();

// Update Post (/posts/:postId)
router.patch(
  "/:postId",
  authMiddleware,
  employerCandidate,
  upload.single("media"),
  async (req, res) => {
    try {
      const { postId } = req.params;
      const { content } = req.body;

// Find existing post
const posts = await queryDatabase(
  `
  SELECT *
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

const existingPost = posts[0];

// Keep old values
let updatedContent = existingPost.content;
let updatedMediaType = existingPost.media_type;
let updatedFileName = existingPost.file_name;
let updatedFilePath = existingPost.file_path;

// Update content only if provided
if (content !== undefined) {
  updatedContent = content;
}

// New file uploaded
if (req.file) {
  // Delete old file
  if (existingPost.file_path && fs.existsSync(existingPost.file_path)) {
    fs.unlinkSync(existingPost.file_path);
  }

  updatedFileName = req.file.filename;
  updatedFilePath = req.file.path;

  if (req.file.mimetype.startsWith("image/")) {
    updatedMediaType = "Image";
  } else if (req.file.mimetype.startsWith("video/")) {
    updatedMediaType = "Video";
  } else {
    updatedMediaType = "Document";
  }
}

// Update database
await queryDatabase(
  `
  UPDATE posts
  SET
    content = ?,
    media_type = ?,
    file_name = ?,
    file_path = ?
  WHERE
    post_id = ?
    AND user_id = ?
  `,
  [
    updatedContent,
    updatedMediaType,
    updatedFileName,
    updatedFilePath,
    postId,
    req.user.id,
  ],
);

res.status(200).json({
  message: "Post updated successfully",
});

  } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Failed to update post",
      });
    }
  },
);

module.exports = router;