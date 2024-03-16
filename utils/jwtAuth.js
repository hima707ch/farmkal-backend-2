const jwt = require("jsonwebtoken");

const sendToken = (user, statuscode, res) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "100d",
  });

  const options = {
    expires: new Date(
      Date.now() + 5 * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
    sameSite: "none",
    secure: true,
  };

  res.status(statuscode).cookie('token', token, options).json({
    success: true,
    user,
    token,
  });
};

module.exports = sendToken;
