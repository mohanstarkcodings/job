const express = require("express");
const { queryDatabase } = require("../../db.js");
const { authMiddleware, candidate } = require("../../auth/authorisation.js");
const upload = require("../../middleware/upload.js");

const router = express.Router();

// Apply For Job (/jobs/apply)
router.post(
  "/apply",
  authMiddleware,
  candidate,
  upload.single("resume"),
  async (req, res) => {
    try {
      // console.log(req.body);
      // console.log(req.file);
      const { job_id, ...answers } = req.body;

      // Resume must be uploaded
      if (!req.file) {
        return res.status(400).json({
          message: "Resume is required",
        });
      }

      // Store resume
      const resumeResult = await queryDatabase(
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
        [req.user.id, req.file.filename, req.file.path],
      );

      const resumeId = resumeResult.insertId;

      // Create application
      const applicationResult = await queryDatabase(
        `
        INSERT INTO job_applications
        (
          candidate_id,
          job_id,
          resume_id
        )
        VALUES
        (
          ?, ?, ?
        )
        `,
        [req.user.id, job_id, resumeId],
      );

      const applicationId = applicationResult.insertId;

      // Store additional answers
      for (const [question, answer] of Object.entries(answers)) {
        await queryDatabase(
          `
          INSERT INTO application_answers
          (
            application_id,
            question_name,
            answer_value
          )
          VALUES
          (
            ?, ?, ?
          )
          `,
          [applicationId, question, String(answer)],
        );
      }

      // Get employer id and job title
      const job = await queryDatabase(
        `
  SELECT
    employer_id,
    job_title
  FROM jobs
  WHERE job_id = ?
  `,
        [job_id],
      );

      // Insert notification for employer
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
        [
          job[0].employer_id,
          applicationId,
          "New Application",
          `A new application for "${job[0].job_title}" has been received.`,
        ],
      );

      res.status(201).json({
        message: "Application submitted successfully",
        application_id: applicationId,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Failed to submit application",
      });
    }
  },
);

// View All Applied Jobs List(/jobs/my)
router.get("/apply/my", authMiddleware, candidate, async (req, res) => {
  try {
    const applications = await queryDatabase(
      `
        SELECT
          ja.application_id,
          j.job_id,
          j.job_title,
          j.location,
          j.job_type,
          j.work_mode,
          ja.application_status,
          ja.applied_at
        FROM job_applications ja
        INNER JOIN jobs j
          ON ja.job_id = j.job_id
        WHERE ja.candidate_id = ?
        ORDER BY ja.applied_at DESC
        `,
      [req.user.id],
    );

    res.status(200).json(applications);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch applied jobs",
    });
  }
});

//  View Applied Job Information (/jobs/my/:applicationId)
router.get(
  "/apply/my/:applicationId",
  authMiddleware,
  candidate,
  async (req, res) => {
    try {
      const { applicationId } = req.params;

      const application = await queryDatabase(
        `
        SELECT
          ja.application_id,
          ja.application_status,
          ja.applied_at,

          j.job_title,
          j.job_description,
          j.required_skills,
          j.experience_required,
          j.salary,
          j.job_type,
          j.work_mode,
          j.location,
          j.vacancies,
          j.application_deadline
        FROM job_applications ja
        INNER JOIN jobs j
          ON ja.job_id = j.job_id
        WHERE
          ja.application_id = ?
          AND ja.candidate_id = ?
        `,
        [applicationId, req.user.id],
      );

      if (application.length === 0) {
        return res.status(404).json({
          message: "Application not found",
        });
      }

      const answers = await queryDatabase(
        `
        SELECT
          question_name,
          answer_value
        FROM application_answers
        WHERE application_id = ?
        `,
        [applicationId],
      );

      res.status(200).json({
        application: application[0],
        answers,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Failed to fetch application details",
      });
    }
  },
);

module.exports = router;