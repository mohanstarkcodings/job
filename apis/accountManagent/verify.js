const express = require("express");
const { queryDatabase } = require("../../db.js");
const {
  authMiddleware,
} = require("../../auth/authorisation.js");

const bcrypt = require("bcrypt");
const otpGenerator = require("otp-generator");
const nodemailer = require("nodemailer");

const router = express.Router();

// Email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

router.post("/sendOtp", authMiddleware, async (req, res) => {
  try {
    const otp = otpGenerator.generate(6, {
      digits: true,
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    const expiresAt = new Date(Date.now() + 2 * 60 * 1000);

    const user = await queryDatabase(
      `
        SELECT email
        FROM users
        WHERE user_id = ?
        `,
      [req.user.id],
    );

    await queryDatabase(
      `
        INSERT INTO email_verification_otps
        (
          user_id,
          otp_code,
          expires_at
        )
        VALUES
        (
          ?, ?, ?
        )
        `,
      [req.user.id, otp, expiresAt],
    );

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user[0].email,
      subject: "Email Verification OTP",
      text: `Your OTP is ${otp}. Valid for 2 minutes.`,
    });

    res.status(200).json({
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to send OTP",
    });
  }
});

router.post("/verifyOtp", authMiddleware, async (req, res) => {
  try {
    const { otp } = req.body;

    const records = await queryDatabase(
      `
        SELECT *
        FROM email_verification_otps
        WHERE user_id = ?
        AND is_used = FALSE
        ORDER BY otp_id DESC
        LIMIT 1
        `,
      [req.user.id],
    );

    if (records.length === 0) {
      return res.status(404).json({
        message: "No OTP found",
      });
    }

    const record = records[0];

    if (new Date() > new Date(record.expires_at)) {
      return res.status(400).json({
        message: "OTP expired",
      });
    }

    if (record.otp_code !== otp) {
      return res.status(401).json({
        message: "Invalid OTP",
      });
    }

    await queryDatabase(
      `
        UPDATE email_verification_otps
        SET is_used = TRUE
        WHERE otp_id = ?
        `,
      [record.otp_id],
    );

    await queryDatabase(
      `
        UPDATE users
        SET is_verified = TRUE
        WHERE user_id = ?
        `,
      [req.user.id],
    );

    res.status(200).json({
      message: "Account verified successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "OTP verification failed",
    });
  }
});

module.exports =router;