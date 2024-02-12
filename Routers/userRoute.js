const {
  create,
  updateUser,
  login,
  getChatUserList,
  getChatData,
  getAllUser,
  getUser,
  updateCart,
  myDetails,
} = require("../Controler/user");
const authenticateToken = require("../Middleware/authUser");

const router = require("express").Router();

router.route("/register").post(create).put(authenticateToken, updateUser);
router.route('/me').get(authenticateToken , myDetails)
router.route("/login").post(login);
router.route("/cart").put(authenticateToken, updateCart);

router.route("/chat").get(
  (req, res, next) => {
    console.log("reached");
    next();
  },
  authenticateToken,
  getChatUserList,
);
router.route("/chat/:id").get(authenticateToken, getChatData);

router.route("/users").get(getAllUser);
router.route("/user/:id").get(getUser);

module.exports = router;
