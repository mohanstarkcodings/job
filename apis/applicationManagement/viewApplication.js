const express = require("express");
const { queryDatabase } = require("../../db.js");
const {
  authMiddleware,
  employer,
  candidate,
  employerAdmin,
} = require("../../auth/authorisation.js");

const router = express.Router();

// View Applicants (/applications/job/:jobId)
router.get(
  "/job/:jobId",
  authMiddleware,
  employer,
  async (req, res) => {
    try {
      const { jobId } = req.params;

      const applicants = await queryDatabase(
        `
        SELECT
          ja.application_id,
          cp.full_name AS candidate_name,
          u.email AS candidate_email,
          ja.applied_at,
          ja.application_status AS status
        FROM job_applications ja
        INNER JOIN candidate_profiles cp
          ON ja.candidate_id = cp.candidate_id
        INNER JOIN users u
          ON cp.candidate_id = u.user_id
        INNER JOIN jobs j
          ON ja.job_id = j.job_id
        WHERE
          ja.job_id = ?
          AND j.employer_id = ?
        ORDER BY ja.applied_at DESC
        `,
        [jobId, req.user.id]
      );

      res.status(200).json(applicants);

    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Failed to fetch applicants",
      });
    }
  }
);

// View Candidate Resume (/applications/:applicationId/resume)
router.get(
  "/:applicationId/resume",
  authMiddleware,
  employer,
  async (req, res) => {
    try {
      const { applicationId } = req.params;

      const resumes = await queryDatabase(
        `
        SELECT
          r.resume_id,
          r.file_name,
          r.file_path
        FROM job_applications ja
        INNER JOIN resume r
          ON ja.resume_id = r.resume_id
        INNER JOIN jobs j
          ON ja.job_id = j.job_id
        WHERE
          ja.application_id = ?
          AND j.employer_id = ?
        `,
        [applicationId, req.user.id]
      );

      if (resumes.length === 0) {
        return res.status(404).json({
          message: "Resume not found",
        });
      }

       res.status(200).json({
         resume_id: resumes[0].resume_id,
         file_name: resumes[0].file_name,
         resume_url: `http://localhost:3500/uploads/${resumes[0].file_name}`,
         uploaded_at: resumes[0].uploaded_at,
       });

    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Failed to fetch resume",
      });
    }
  }
);

// View Own Resume (/applications/myResume)
router.get(
  "/myResume",
  authMiddleware,
  candidate,
  async (req, res) => {
    try {
      const resumes = await queryDatabase(
        `
        SELECT
          resume_id,
          file_name,
          uploaded_at
        FROM resume
        WHERE candidate_id = ?
        ORDER BY uploaded_at DESC
        LIMIT 1
        `,
        [req.user.id]
      );

      if (resumes.length === 0) {
        return res.status(404).json({
          message: "Resume not found",
        });
      }

      res.status(200).json({
        resume_id: resumes[0].resume_id,
        file_name: resumes[0].file_name,
        resume_url: `http://localhost:3500/uploads/${resumes[0].file_name}`,
        uploaded_at: resumes[0].uploaded_at,
      });

    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Failed to fetch resume",
      });
    }
  }
);

module.exports = router;