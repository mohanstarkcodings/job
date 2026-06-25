const express = require("express");
const { queryDatabase } = require("../../db.js");
const {
  authMiddleware,
  employer,
  candidate,
} = require("../../auth/authorisation.js");

const upload = require("../../middleware/upload.js");
const fs = require("fs");

const router = express.Router();

// Set Application Status (/applications/:applicationId/status)
router.patch(
  "/:applicationId/status",
  authMiddleware,
  employer,
  async (req, res) => {
    try {
      const { applicationId } = req.params;
      const { status } = req.body;

      // Update application status
      const result = await queryDatabase(
        `
        UPDATE job_applications ja
        INNER JOIN jobs j
          ON ja.job_id = j.job_id
        SET
          ja.application_status = ?
        WHERE
          ja.application_id = ?
          AND j.employer_id = ?
        `,
        [status, applicationId, req.user.id],
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: "Application not found or unauthorized",
        });
      }

      // Get candidate id and job title
      const application = await queryDatabase(
        `
        SELECT
          ja.candidate_id,
          j.job_title
        FROM job_applications ja
        INNER JOIN jobs j
          ON ja.job_id = j.job_id
        WHERE ja.application_id = ?
        `,
        [applicationId],
      );

      const candidateId = application[0].candidate_id;
      const jobTitle = application[0].job_title;

      // Notification message
      const message = `Your application for ${jobTitle} has been ${status}.`;

      // Insert notification for candidate
      await queryDatabase(
        `
        INSERT INTO notifications
        (
          user_id,
          application_id,
          notification_type,
          message,
          is_read
        )
        VALUES
        (
          ?, ?, ?, ?, FALSE
        )
        `,
        [candidateId, applicationId, status, message],
      );

      res.status(200).json({
        message: "Application status updated successfully",
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Failed to update application status",
      });
    }
  },
);

// Update Resume (/applications/resume)
router.put(
  "/resume",
  authMiddleware,
  candidate,
  upload.single("resume"),
  async (req, res) => {
    try {
      // Resume file is required
      if (!req.file) {
        return res.status(400).json({
          message: "Resume file is required",
        });
      }

      // Find the latest uploaded resume
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

      // Delete old PDF from uploads folder
      if (fs.existsSync(resume.file_path)) {
        fs.unlinkSync(resume.file_path);
      }

      // Update database record
      await queryDatabase(
        `
        UPDATE resume
        SET
          file_name = ?,
          file_path = ?,
          uploaded_at = CURRENT_TIMESTAMP
        WHERE resume_id = ?
        `,
        [req.file.filename, req.file.path, resume.resume_id],
      );

      res.status(200).json({
        message: "Resume updated successfully",
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Failed to update resume",
      });
    }
  },
);

module.exports = router;
