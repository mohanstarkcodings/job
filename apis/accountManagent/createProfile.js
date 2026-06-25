const express = require("express");
const { queryDatabase } = require("../../db.js");
const {
  authMiddleware,
  employer,candidate
} = require("../../auth/authorisation.js");

const router = express.Router();

// create employer profile (/account /employerProfile)
router.post("/employerProfile", authMiddleware, async (req, res) => {
  try {
    const {
      company_logo,
      company_name,
      company_description,
      contact_number,
      website,
      industry_type,
      city,
      state,
      country,
      company_size,
      founded,
    } = req.body;

    await queryDatabase(
      `
        INSERT INTO employer_profiles
        (
          employer_id,
          company_logo,
          company_name,
          company_description,
          contact_number,
          website,
          industry_type,
          city,
          state,
          country,
          company_size,
          founded
        )
        VALUES
        (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
        `,
      [
        req.user.id,
        company_logo,
        company_name,
        company_description,
        contact_number,
        website,
        industry_type,
        city,
        state,
        country,
        company_size,
        founded,
      ],
    );

    await queryDatabase(
      `
        UPDATE users
        SET role = 'Employer'
        WHERE user_id = ?
        `,
      [req.user.id],
    );

    res.status(201).send({
      message: "Employer profile created successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create employer profile",
    });
  }
});

// create candidate profile (/account/candidateProfile)
router.post("/candidateProfile", authMiddleware, async (req, res) => {
  try {
    const {
      full_name,
      profile_photo,
      phone_number,
      city,
      state,
      country,
      professional_headline,
      skills,
      degree,
      college_name,
      graduation_year,
      cgpa,
      experience_level,
      years_of_experience,
      linkedin_url,
      github_url,
      portfolio_url,
    } = req.body;

    await queryDatabase(
      `
        INSERT INTO candidate_profiles
        (
          candidate_id,
          full_name,
          profile_photo,
          phone_number,
          city,
          state,
          country,
          professional_headline,
          skills,
          degree,
          college_name,
          graduation_year,
          cgpa,
          experience_level,
          years_of_experience,
          linkedin_url,
          github_url,
          portfolio_url
        )
        VALUES
        (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
        `,
      [
        req.user.id,
        full_name,
        profile_photo,
        phone_number,
        city,
        state,
        country,
        professional_headline,
        skills,
        degree,
        college_name,
        graduation_year,
        cgpa,
        experience_level,
        years_of_experience || 0,
        linkedin_url,
        github_url,
        portfolio_url,
      ],
    );

    await queryDatabase(
      `
        UPDATE users
        SET role = 'Candidate'
        WHERE user_id = ?
        `,
      [req.user.id],
    );

    res.status(201).send({
      message: "Candidate profile created successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create candidate profile",
    });
  }
});

module.exports = router;