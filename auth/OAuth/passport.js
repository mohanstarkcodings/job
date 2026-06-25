const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { queryDatabase } = require("../../db.js");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },

    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(new Error("Email not found from Google"));
        }

        // Check existing user

        const existingUsers = await queryDatabase(
          "SELECT * FROM users WHERE email = ?",
          [email],
        );

        // Existing User -> Login 

        if (existingUsers.length > 0) {
          return done(null, existingUsers[0]);
        }

        // New User -> Create Participant 

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
        NULL,
        'Pending',
        'google'
      )
      `,
           [email],
         );
        
        const newUser = {
          user_id: result.insertId,
          email,
          role: "Pending",
          provider: "google",
        };

        return done(null, newUser);
      } catch (error) {
        return done(error);
      }
    },
  ),
);
