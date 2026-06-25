const express = require("express");
const { queryDatabase } = require("../../db.js");
const { authMiddleware, candidate } = require("../../auth/authorisation.js");

const fs = require("fs");

const router = express.Router();

// Delete Resume (/applications/resume)
router.delete("/resume", authMiddleware, candidate, async (req, res) => {
  try {
    // Find candidate's latest uploaded resume
    const resumes = await queryDatabase(
      `
        SELECT
          resume_id,
          file_path
        FROM resume
        WHERE candidate_id = ?
        ORDER BY uploaded_at DESC
        LIMIT 1
        `,
      [req.user.id],
    );

    if (resumes.length === 0) {
      return res.status(404).json({
        message: "Resume not found",
      });
    }

    const resume = resumes[0];

    // Delete file from uploads folder
    if (fs.existsSync(resume.file_path)) {
      fs.unlinkSync(resume.file_path);
    }

    // Delete database record
    await queryDatabase(
      `
        DELETE FROM resume
        WHERE resume_id = ?
        `,
      [resume.resume_id],
    );

    res.status(200).json({
      message: "Resume deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to delete resume",
    });
  }
});

module.exports = router;