const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { queryDatabase } = require("../db.js");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { email, password } = req.body;

    const users = await queryDatabase("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (users.length === 0) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    const user = users[0];
    
    if (user.provider === "google") {
      return res.status(400).json({
        message: "Please login using Google",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid password",
      });
    }

    if (user.account_status === "PendingDeletion") {
      return res.status(403).json({
        message: "Account scheduled for deletion",
      });
    }

    if (!user.is_verified) {
      return res.status(403).json({
        message: "Please verify your email first",
      });
    }

    const token = jwt.sign(
      {
        id: user.user_id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      },
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.user_id,
        email: user.email,
        role: user.role,
      },
    });


  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Login failed",
    });
  }
});

module.exports = router;
