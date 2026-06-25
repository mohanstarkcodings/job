const express = require("express");
const { queryDatabase } = require("../../db.js");
const bcrypt = require("bcrypt");
const {
  authMiddleware,
} = require("../../auth/authorisation.js");

const cron = require("node-cron");

const router = express.Router();

// the employer or candidate wishes to delete their own account
router.delete("/deleteAccount", authMiddleware, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        message: "Password is required",
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

    const isMatch = await bcrypt.compare(password, users[0].password_hash);

    if (!isMatch) {
      return res.status(401).json({
        message: "Incorrect password",
      });
    }

    await queryDatabase(
      `
        UPDATE users
        SET
          account_status = 'PendingDeletion',
          deletion_date = DATE_ADD(NOW(), INTERVAL 30 DAY)
        WHERE user_id = ?
        `,
      [req.user.id],
    );

    res.status(200).json({
      message: "Account scheduled for deletion after 30 days",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to delete account",
    });
  }
});


// Every day at midnight
cron.schedule("0 0 * * *", async () => {
  try {
    const result = await queryDatabase(
      `
      DELETE FROM users
      WHERE account_status = 'PendingDeletion'
      AND deletion_date <= NOW()
      `,
    );

    console.log(`${result.affectedRows} expired accounts deleted`);
  } catch (error) {
    console.error("Cron job account deletion failed:", error);
  }
});

module.exports = router;