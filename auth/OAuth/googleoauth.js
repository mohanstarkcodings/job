const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");

const router = express.Router();

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
    session: false,
  }),
);

router.get(
  "/googlesigncallback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login-failed",
  }),
  async (req, res) => {
    const token = jwt.sign(
      {
        id: req.user.user_id,
        email: req.user.email,
        role: req.user.role,
        provider: "google",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      },
    );

    res.redirect(`/googlesuccess.html?token=${token}`);
  },
);

module.exports = router;
