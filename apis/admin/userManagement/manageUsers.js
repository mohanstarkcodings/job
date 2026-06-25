const express = require("express");
const { queryDatabase } = require("../../../db.js");
const { authMiddleware, admin } = require("../../../auth/authorisation.js");
const bcrypt = require("bcrypt");

const router = express.Router();

// Delete User (/admin/users/:userId)
router.delete("/users/:userId", authMiddleware, admin, async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await queryDatabase(
      `
        DELETE FROM users
        WHERE user_id = ?
        `,
      [userId],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to delete user",
    });
  }
});

// Suspend or block User (/admin/users/:userId/suspend)
router.patch(
  "/users/:userId/suspend",
  authMiddleware,
  admin,
  async (req, res) => {
    try {
      const { userId } = req.params;

      const result = await queryDatabase(
        `
        UPDATE users
        SET account_status = 'Suspended'
        WHERE user_id = ?
        `,
        [userId],
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      res.status(200).json({
        message: "User suspended successfully",
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Failed to suspend user",
      });
    }
  },
);

module.exports = router;
