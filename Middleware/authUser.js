const CustomError = require("../utils/CustomError");
const jwt = require("jsonwebtoken");
const User = require("../Models/user");

const authenticateToken = async (req, res, next) => {
  try {
    console.log("auth start");
    const authHeader = req.header("Authorization");
    let token;

    if (authHeader) token = authHeader.split(" ")[1];

    if (!token) {
      token = req.cookies.token;
    }

    if (!token) {
      return next(new CustomError("Invalid user, no token", 401));
    }
    console.log("token", token);
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    if (!decodedToken) {
      return next(new CustomError("permission denied", 403));
    }

    req.user = await User.findById(decodedToken.id);

    next();
  } catch (err) {
    res.status(200).json({
      success: false,
      message: "Invalid credentials for auth",
    });
  }
};

module.exports = authenticateToken;
