const express = require("express");
const { queryDatabase } = require("../../db.js");
const {
  authMiddleware,
  employer,
} = require("../../auth/authorisation.js");

const router = express.Router();

//create a new job (/jobs)
router.post("/postJob", authMiddleware, /* employer,  */async (req, res) => {
  try {
    const {
      job_title,
      job_description,
      required_skills,
      experience_required,
      salary,
      job_type,
      work_mode,
      location,
      vacancies,
      application_deadline,
    } = req.body;

    await queryDatabase(
      `
        INSERT INTO jobs
        (
          employer_id,
          job_title,
          job_description,
          required_skills,
          experience_required,
          salary,
          job_type,
          work_mode,
          location,
          vacancies,
          application_deadline
        )
        VALUES
        (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
        `,
      [
        req.user.id,
        job_title,
        job_description,
        required_skills,
        experience_required,
        salary,
        job_type,
        work_mode,
        location,
        vacancies,
        application_deadline,
      ],
    );

    res.status(201).json({
      message: "Job posted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to post job",
    });
  }
});

//edit job details  ( /jobs/:jobId)
router.patch("/:jobId", authMiddleware, employer, async (req, res) => {
  try {
    const { jobId } = req.params;

    const updates = [];
    const values = [];

    for (const [key, value] of Object.entries(req.body)) {
      updates.push(`${key} = ?`);
      values.push(value);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        message: "No fields provided for update",
      });
    }

    values.push(jobId);
    values.push(req.user.id);

    const result = await queryDatabase(
      `
        UPDATE jobs
        SET ${updates.join(", ")}
        WHERE job_id = ?
        AND employer_id = ?
        `,
      values,
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Job not found or unauthorized",
      });
    }

    res.status(200).json({
      message: "Job updated successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to update job",
    });
  }
});

// soft Delete Job  ( /jobs/:jobId)
router.delete("/:jobId", authMiddleware, employer ,async (req, res) => {
  try {
    const { jobId } = req.params;

    const result = await queryDatabase(
      `
        UPDATE jobs
        SET job_status = 'Removed'
        WHERE job_id = ?
        AND employer_id = ?
        `,
      [jobId, req.user.id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Job not found or unauthorized",
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
});

module.exports = router;