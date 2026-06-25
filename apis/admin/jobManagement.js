const express = require("express");
const { queryDatabase } = require("../../db.js");
const { authMiddleware, admin } = require("../../auth/authorisation.js");

const router = express.Router();

// Remove Fake Job (/admin/jobs/:jobId/remove)
router.patch(
  "/jobs/:jobId/remove",
  /* authMiddleware, admin, */ async (req, res) => {
    try {
      const { jobId } = req.params;

      const result = await queryDatabase(
        `
        UPDATE jobs
        SET job_status = 'Removed'
        WHERE job_id = ?
        `,
        [jobId],
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: "Job not found",
        });
      }

      res.status(200).json({
        message: "Job removed successfully",
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Failed to remove job",
      });
    }
  },
);

// View Total Jobs (/admin/reports/totalJobs)
router.get("/reports/totalJobs", authMiddleware, admin, async (req, res) => {
  try {
    const result = await queryDatabase(
      `
        SELECT COUNT(*) AS total_jobs
        FROM jobs
        WHERE job_status IN ('Open', 'Closed')
        `,
    );

    res.status(200).json({
      total_jobs: result[0].total_jobs,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch total jobs",
    });
  }
});

module.exports = router;