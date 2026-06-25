const express = require("express");
const { queryDatabase } = require("../../db.js");
const {
  authMiddleware,
  employer,
} = require("../../auth/authorisation.js");

const router = express.Router();

// show all jobs in the database (/jobs?page=1&limit=10)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const offset = (page - 1) * limit;

    const jobs = await queryDatabase(
      `
      SELECT
        job_id,
        job_title,
        experience_required,
        salary,
        job_type,
        work_mode,
        location,
        vacancies,
        application_deadline,
        created_at
      FROM jobs
      WHERE job_status = 'Open'
      ORDER BY created_at DESC
      LIMIT ?
      OFFSET ?
      `,
      [limit, offset],
    );

    res.status(200).json(jobs);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch jobs",
    });
  }
});

// Search Jobs (/jobs/search?job title or description or skills or location or combination of this)
router.get("/search", authMiddleware, async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword) {
      return res.status(400).json({
        message: "Search keyword is required",
      });
    }

    const jobs = await queryDatabase(
      `
      SELECT
        job_id,
        job_title,
        experience_required,
        salary,
        job_type,
        work_mode,
        location,
        vacancies,
        application_deadline,
        created_at
      FROM jobs
      WHERE job_status = 'Open'
      AND
      (
        job_title LIKE ?
        OR job_description LIKE ?
        OR required_skills LIKE ?
        OR location LIKE ?
      )
      ORDER BY created_at DESC
      `,
      [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`],
    );

    res.status(200).json(jobs);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to search jobs",
    });
  }
});

// filter Jobs (/jobs/filter?location=xxx& work mode=xxx & jobType= xxx & experience_required=xxx)
router.get("/filter", authMiddleware, async (req, res) => {
  try {
    const filters = [];
    const values = [];

    if (req.query.location) {
      filters.push("location = ?");
      values.push(req.query.location);
    }

    if (req.query.job_type) {
      filters.push("job_type = ?");
      values.push(req.query.job_type);
    }

    if (req.query.work_mode) {
      filters.push("work_mode = ?");
      values.push(req.query.work_mode);
    }

    if (req.query.experience_required) {
      filters.push("experience_required = ?");
      values.push(req.query.experience_required);
    }

    let sql = `
        SELECT *
        FROM jobs
        WHERE job_status = 'Open'
      `;

    if (filters.length > 0) {
      sql += ` AND ${filters.join(" AND ")}`;
    }

    sql += ` ORDER BY created_at DESC`;

    const jobs = await queryDatabase(sql, values);

    res.status(200).json(jobs);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Filter failed",
    });
  }
});

//View All Posted Jobs (/jobs/my?page=1&limit=10)
router.get("/my", authMiddleware, employer, async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const offset = (page - 1) * limit;

    const jobs = await queryDatabase(
      `
        SELECT
          job_id,
          job_title,
          experience_required,
          salary,
          job_type,
          work_mode,
          location,
          vacancies,
          application_deadline,
          job_status,
          created_at
        FROM jobs
        WHERE employer_id = ?
        ORDER BY created_at DESC
        LIMIT ?
        OFFSET ?
        `,
      [req.user.id, limit, offset],
    );

    res.status(200).json(jobs);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch employer jobs",
    });
  }
});

//View Job Details  (/jobs/:jobId)
router.get("/:jobId", authMiddleware, async (req, res) => {
  try {
    const { jobId } = req.params;

    const jobs = await queryDatabase(
      `
        SELECT *
        FROM jobs
        WHERE job_id = ?
        `,
      [jobId],
    );

    if (jobs.length === 0) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    res.status(200).json(jobs[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch job details",
    });
  }
});

module.exports = router;