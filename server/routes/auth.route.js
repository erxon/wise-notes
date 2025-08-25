const { Router } = require("express");
const router = Router();
const passport = require("passport");

router.post("/signin", passport.authenticate("local"), (req, res) => {
  req.isAuthenticated()
    ? res.status(200).json({ id: req.user.id, email: req.user.email })
    : res.status(401).json({ message: "Invalid credentials" });
});

router.get(
  "/google",
  passport.authenticate("google", { scope: ["email", "profile"] })
);

router.get("/google/callback", passport.authenticate("google"), (req, res) => {
  res.redirect(process.env.ORIGIN);
});

router.get("/signout", (req, res) => {
  req.logout((error) => {
    if (error) {
      console.error("Logout error:", error);
      res.status(200).json({ message: "Logout failed" });
    }
    req.session.destroy((error) => {
      if (error) {
        console.error("Session destroy error:", error);
        res.status(200).json({ message: "Logout failed" });
      }
      res.status(200).json({ message: "Logout successful" });
    });
  });
});

module.exports = router;
