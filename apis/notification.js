const express = require("express");
const { queryDatabase } = require("../db.js");
const {
  authMiddleware,
  employerCandidate,
} = require("../auth/authorisation.js");

const router = express.Router();

// View all unread Notifications (/notifications)
router.get(
  "/",
  authMiddleware,
  employerCandidate,
  async (req, res) => {
    try {
      const notifications = await queryDatabase(
        `
        SELECT
          notification_id,
          application_id,
          notification_type,
          message,
          created_at
        FROM notifications
        WHERE
          user_id = ?
          AND is_read = FALSE
        ORDER BY created_at DESC
        `,
        [req.user.id]
      );

      res.status(200).json(notifications);

    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Failed to fetch notifications",
      });
    }
  }
);

// View Notification Details (/notifications/:notificationId)
router.get(
  "/:notificationId",
  authMiddleware,
  employerCandidate,
  async (req, res) => {
    try {
      const { notificationId } = req.params;

      const notification = await queryDatabase(
        `
        SELECT *
        FROM notifications
        WHERE
          user_id = ?
          AND notification_id = ?
        `,
        [req.user.id, notificationId]
      );

      if (notification.length === 0) {
        return res.status(404).json({
          message: "Notification not found",
        });
      }

      await queryDatabase(
        `
        UPDATE notifications
        SET is_read = TRUE
        WHERE
          user_id = ?
          AND notification_id = ?
        `,
        [req.user.id, notificationId]
      );

      res.status(200).json(notification[0]);

    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Failed to fetch notification",
      });
    }
  }
);

// Delete Notification (/notifications/remove)
router.delete(
  "/remove",
  authMiddleware,
  employerCandidate,
  async (req, res) => {
    try {
      const { notification_id } = req.body;

      await queryDatabase(
        `
        DELETE FROM notifications
        WHERE
          user_id = ?
          AND notification_id = ?
        `,
        [req.user.id, notification_id]
      );

      res.status(200).json({
        message: "Notification deleted successfully",
      });

    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Failed to delete notification",
      });
    }
  }
);

module.exports = router;