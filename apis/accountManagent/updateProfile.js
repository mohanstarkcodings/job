const express = require("express");
const { queryDatabase } = require("../../db.js");
const {
  authMiddleware,
  employer,candidate
} = require("../../auth/authorisation.js");

const router = express.Router();

// update employer profile (/account /employerProfile)
router.patch("/employerProfile", authMiddleware, employer, async (req, res) => {
  try {
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

    values.push(req.user.id);

    await queryDatabase(
      `
        UPDATE employer_profiles
        SET ${updates.join(", ")}
        WHERE employer_id = ?
        `,
      values,
    );

    res.status(200).json({
      message: "profile updated successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to update profile",
    });
  }
});

// update candidate profile (/account/candidateProfile)
router.patch(
  "/candidateProfile",
  authMiddleware,
  candidate,
  async (req, res) => {
    try {
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

      values.push(req.user.id);

      await queryDatabase(
        `
        UPDATE candidate_profiles
        SET ${updates.join(", ")}
        WHERE candidate_id = ?
        `,
        values
      );

      res.status(200).json({
        message: "Candidate profile updated successfully",
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Failed to update candidate profile",
      });
    }
  }
);

module.exports = router;