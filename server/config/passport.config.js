const LocalStrategy = require("passport-local").Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/user.model");
const bcrypt = require("bcrypt");

function initialize(passport) {
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await User.findOne({ email: username });
        if (!user) return done(null, false, { message: "No user found" });

        //If the user don't have a password, the user signed in with Google
        if (!user.hash) {
          return done(null, false, {
            message:
              "Please sign in with Google - this account was created using Google OAuth",
          });
        }

        const isValid = await bcrypt.compare(password, user.hash);
        if (!isValid)
          return done(null, false, { message: "Incorrect password" });

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  //Google Strategy
  passport.use(
    "google",
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/v1/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists with Google ID
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            return done(null, user);
          }

          // Check if user exists with same email (account linking)
          const existingUser = await User.findOne({
            email: profile.emails[0].value,
          });

          if (existingUser) {
            // Link Google account to existing user
            existingUser.googleId = profile.id;
            existingUser.profilePicture = profile.photos[0]?.value;
            await existingUser.save();
            return done(null, existingUser);
          }

          // Create new user with Google data
          const newUser = new User({
            googleId: profile.id,
            email: profile.emails[0].value,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            profilePicture: profile.photos[0]?.value,
            authMethod: "google",
          });

          await newUser.save();
          return done(null, newUser);
        } catch (error) {
          console.error("Google OAuth error:", error);
          return done(error, null);
        }
      }
    )
  );

  //Serialize
  passport.serializeUser((user, done) => done(null, user.id));

  //Deserialize
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      if (!user) {
        return done(null, false);
      }

      done(null, {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture,
        authMethod: user.authMethod,
        googleId: user.googleId,
      });
    } catch (err) {
      done(err);
    }
  });
}

module.exports = initialize;
