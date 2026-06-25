const express = require("express");
const { queryDatabase } = require("../../../db.js");
const { authMiddleware, admin } = require("../../../auth/authorisation.js");

const router = express.Router();

// View Employers (/admin/employers)
router.get("/employers", authMiddleware, admin, async (req, res) => {
  try {
    const employers = await queryDatabase(
      `
        SELECT
          u.user_id,
          e.company_name,
          e.industry_type,
          e.city,
          e.state,
          e.country,
          u.email,
          u.account_status,
          u.is_verified,
          u.created_at
        FROM users u
        INNER JOIN employer_profiles e
        ON u.user_id = e.employer_id
        WHERE u.role = 'Employer'
        ORDER BY u.created_at DESC
        `,
    );

    res.status(200).json(employers);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch employers",
    });
  }
});

// View total Employers (/admin/reports/totalEmployers)
router.get(
  "/reports/totalEmployers",
  authMiddleware,
  admin,
  async (req, res) => {
    try {
      const result = await queryDatabase(
        `
        SELECT COUNT(*) AS total_employers
        FROM users
        WHERE role = 'Employer'
        `,
      );

      res.status(200).json({
        total_employers: result[0].total_employers,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Failed to fetch employer count",
      });
    }
  },
);

// View Candidates (/admin/candidates)
router.get("/candidates", authMiddleware, admin, async (req, res) => {
  try {
    const candidates = await queryDatabase(
      `
        SELECT
          cp.candidate_id,
          cp.full_name,
          u.email,
          cp.phone_number,
          cp.city,
          cp.state,
          cp.country,
          cp.experience_level,
          cp.years_of_experience,
          u.account_status,
          u.created_at
        FROM candidate_profiles cp
        INNER JOIN users u
          ON cp.candidate_id = u.user_id
        ORDER BY u.created_at DESC
        `,
    );

    res.status(200).json(candidates);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch candidates",
    });
  }
});

// View Total Candidates (/admin/reports/totalCandidates)
router.get(
  "/reports/totalCandidates",
  authMiddleware,
  admin,
  async (req, res) => {
    try {
      const result = await queryDatabase(
        `
        SELECT
          COUNT(*) AS total_candidates
        FROM users
        WHERE role = 'Candidate'
        `,
      );

      res.status(200).json({
        total_candidates: result[0].total_candidates,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Failed to fetch total candidates",
      });
    }
  },
);

module.exports = router;
