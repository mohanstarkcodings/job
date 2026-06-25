const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { queryDatabase } = require("../db");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const existingUser = await queryDatabase(
      "SELECT user_id FROM users WHERE email = ?",
      [email],
    );

    if (existingUser.length > 0) {
      return res.status(409).json({
        message: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await queryDatabase(
      `
      INSERT INTO users
      (
        email,
        password_hash,
        role,
        provider
      )
      VALUES
      (
        ?,
        ?,
        'Pending',
        'local'
      )
      `,
      [email, hashedPassword],
    );

    const token = jwt.sign(
      {
        id: result.insertId,
        email,
        role: "Pending",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      },
    );

    res.status(201).json({
      message: "Account created successfully",
      token,
      user: {
        id: result.insertId,
        email,
        role: "Pending",
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Signup failed",
    });
  }
});

module.exports = router;