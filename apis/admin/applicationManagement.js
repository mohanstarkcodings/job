const express = require("express");
const { queryDatabase } = require("../../db.js");
const {
  authMiddleware,
  admin,
  employerAdmin,
} = require("../../auth/authorisation.js");

const router = express.Router();

// View All Applications (/admin/applications?page=1&limit=10)
router.get("/applications", authMiddleware, employerAdmin, async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const applications = await queryDatabase(
      `
      SELECT
        ja.application_id,
        cp.full_name AS candidate_name,
        u.email AS candidate_email,
        j.job_title,
        ja.application_status,
        ja.applied_at
      FROM job_applications ja
      INNER JOIN candidate_profiles cp
        ON ja.candidate_id = cp.candidate_id
      INNER JOIN users u
        ON cp.candidate_id = u.user_id
      INNER JOIN jobs j
        ON ja.job_id = j.job_id
      ORDER BY ja.applied_at DESC
      LIMIT ?
      OFFSET ?
      `,
      [limit, offset],
    );

    res.status(200).json(applications);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch applications",
    });
  }
});

// View Total Applications (/admin/reports/totalApplications)
router.get(
  "/reports/totalApplications",
  authMiddleware,
  admin,
  async (req, res) => {
    try {
      const result = await queryDatabase(
        `
        SELECT
          COUNT(*) AS total_applications
        FROM job_applications
        `
      );

      res.status(200).json({
        total_applications: result[0].total_applications,
      });

    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Failed to fetch total applications",
      });
    }
  }
);

module.exports = router;