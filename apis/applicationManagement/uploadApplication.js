const express = require("express");
const { queryDatabase } = require("../../db.js");
const {
  authMiddleware,
  candidate,
} = require("../../auth/authorisation.js");
const upload = require("../../middleware/upload.js");

const router = express.Router();

// Upload Resume (/applications/resume)
router.post(
  "/resume",
  authMiddleware,
  candidate,
  upload.single("resume"),
  async (req, res) => {
    try {
      // Check if a file was uploaded
      if (!req.file) {
        return res.status(400).json({
          message: "Resume file is required",
        });
      }

      // Save resume information
      const result = await queryDatabase(
        `
        INSERT INTO resume
        (
          candidate_id,
          file_name,
          file_path
        )
        VALUES
        (
          ?, ?, ?
        )
        `,
        [
          req.user.id,
          req.file.filename,
          req.file.path,
        ]
      );

      res.status(201).json({
        message: "Resume uploaded successfully",
        resume_id: result.insertId,
      });

    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Failed to upload resume",
      });
    }
  }
);

module.exports = router;