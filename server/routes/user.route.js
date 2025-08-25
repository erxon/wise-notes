const { Router } = require("express");
const {
  getUser,
  createUser,
  updateUserBasicInfo,
  updatePassword,
  updateEmail,
} = require("../controllers/user.controller");
const { isAuthenticated } = require("../middlewares/auth.middleware");

const router = Router();

router.post("/", createUser);
router.route("/").get(isAuthenticated, getUser);
router.route("/update/basic-info").put(isAuthenticated, updateUserBasicInfo);

router.route("/update/change-password").put(isAuthenticated, updatePassword);

router.route("/update/email").put(isAuthenticated, updateEmail);

module.exports = router;
