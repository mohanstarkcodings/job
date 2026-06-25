const express = require("express");
const { queryDatabase } = require("../../db.js");
const {
  authMiddleware,
} = require("../../auth/authorisation.js");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const otpGenerator = require("otp-generator");
const nodemailer = require("nodemailer");

const router = express.Router();

/* Email transporter */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

//change forget password (/account/generateOtp)
router.post("/generateOtp", async (req, res) => {
  try {
    const otp = otpGenerator.generate(6, {
      digits: true,
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    const expiresAt = new Date(Date.now() + 2 * 60 * 1000);

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const user = await queryDatabase(
      `
      SELECT user_id, email
      FROM users
      WHERE email = ?
      `,
      [email],
    );

    if (user.length === 0) {
      return res.status(404).json({
        message: "Email not found",
      });
    }

    await queryDatabase(
      `
      INSERT INTO password_reset_otps
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
      [user[0].user_id, otp, expiresAt],
    );

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user[0].email,
      subject: "Password Reset OTP",
      text: `Your OTP is ${otp}. Valid for 2 minutes.`,
    });

    res.status(200).json({
      message: "OTP sent to email",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to send OTP",
    });
  }
});
  
// (account/verifyForgetPasswordOtp)
router.post("/verifyForgetPasswordOtp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const records = await queryDatabase(
      `
      SELECT p.*
      FROM password_reset_otps p
      INNER JOIN users u
      ON p.user_id = u.user_id
      WHERE u.email = ?
      AND p.is_used = FALSE
      ORDER BY p.otp_id DESC
      LIMIT 1
      `,
      [email],
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
      UPDATE password_reset_otps
      SET is_used = TRUE
      WHERE otp_id = ?
      `,
      [record.otp_id],
    );

    const resetToken = crypto.randomUUID();

    const tokenExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await queryDatabase(
      `
      INSERT INTO password_reset_tokens
      (
        user_id,
        reset_token,
        expires_at
      )
      VALUES
      (
        ?, ?, ?
      )
      `,
      [record.user_id, resetToken, tokenExpiresAt],
    );

    res.status(200).json({
      message: "OTP verified successfully",
      resetToken,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "OTP verification failed",
    });
  }
});

// (/account/resetPassword)
router.put("/resetPassword", async (req, res) => {
  try {
    const { resetToken, new_password } = req.body;

    const tokens = await queryDatabase(
      `
      SELECT *
      FROM password_reset_tokens
      WHERE reset_token = ?
      `,
      [resetToken],
    );

    if (tokens.length === 0) {
      return res.status(401).json({
        message: "Invalid reset token",
      });
    }

    const token = tokens[0];

    if (new Date() > new Date(token.expires_at)) {
      return res.status(400).json({
        message: "Reset token expired",
      });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);

    await queryDatabase(
      `
      UPDATE users
      SET password_hash = ?
      WHERE user_id = ?
      `,
      [hashedPassword, token.user_id],
    );

    await queryDatabase(
      `
      DELETE FROM password_reset_tokens
      WHERE token_id = ?
      `,
      [token.token_id],
    );

    res.status(200).json({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Password change failed",
    });
  }
});

//change known password (/account/changeknownPassword)
router.put(
  "/changeKnownPassword",
  authMiddleware,
  async (req, res) => {
    try {
      const { current_password, new_password } = req.body;

      if (!current_password || !new_password) {
        return res.status(400).json({
          message: "Current password and new password are required",
        });
      }

      const users = await queryDatabase(
        `
        SELECT password_hash
        FROM users
        WHERE user_id = ?
        `,
        [req.user.id],
      );

      if (users.length === 0) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      const isMatch = await bcrypt.compare(
        current_password,
        users[0].password_hash,
      );

      if (!isMatch) {
        return res.status(401).json({
          message: "Current password is incorrect",
        });
      }

      const hashedPassword = await bcrypt.hash(new_password, 10);

      await queryDatabase(
        `
        UPDATE users
        SET password_hash = ?
        WHERE user_id = ?
        `,
        [hashedPassword, req.user.id],
      );

      res.status(200).json({
        message: "Password changed successfully",
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Failed to change password",
      });
    }
  },
);

module.exports = router;