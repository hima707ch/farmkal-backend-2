const express = require("express");
const bodyParse = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const User = require("./Models/user");
const fileUpload = require("express-fileupload");

const userRouter = require("./Routers/userRoute");
const productRouter = require("./Routers/productRoute");
const mandiRouter = require("./Routers/mandiRoute");

const passport = require("passport");
const OAuth2Strategy = require("passport-google-oauth2").Strategy;
const session = require("express-session");
const configPassport = require("./Middleware/oAuth");

const globalErrorHandler = require("./Controler/errorController");
const CustomError = require("./utils/CustomError");
const sendToken = require("./utils/jwtAuth");

const app = express();

const clientid =
  "189609013776-3kfq5hlijarvcn4ls1rd7qingld9lk86.apps.googleusercontent.com";
const clientsecret = "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";

// setting cors
app.use(
  cors({
    origin: [
      "https://www.farmkal.in",
      "https://farmkal.web.app",
      "http://localhost:3000",
    ],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  }),
);

// middleware;
app.use(bodyParse.urlencoded({ extended: true }));
app.use(bodyParse.json());
app.use(cookieParser());
app.use(express.json());
app.use(fileUpload());

app.use(
  session({
    secret: "YOUR SECRET KEY",
    resave: false,
    saveUninitialized: true,
  }),
);

// setuppassport
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new OAuth2Strategy(
    {
      clientID: clientid,
      clientSecret: clientsecret,
      callbackURL: `${process.env.MY_DOMAIN}/auth/google/callback`,
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ email: profile.emails[0].value });

        if (!user) {
          user = await User.create({
            name: profile.displayName,
            email: profile.emails[0].value,
            photoUrl: profile.photos[0].value,
          });
        }

        console.log(user);

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    },
  ),
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// initial google ouath login
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    successRedirect: `${process.env.FRONT_DOMAIN}/login`,
    failureRedirect: `${process.env.FRONT_DOMAIN}/fail`,
  }),
);

app.get("/login/sucess", async (req, res, next) => {
  console.log("login success", req.user);
  if (req.isAuthenticated()) {
    console.log("here");
    let user = await User.findOne({ email: req.user.email });

    if (!user) {
      return next(new CustomError());
    }

    sendToken(user, 200, res);
  } else {
    res.status(400).json({ message: "Not Authorized", user: {} });
  }
});

app.get("/logout", (req, res, next) => {
  console.log("log");
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
  });

  res.cookie("token", null, {
    expires: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: "none",
    secure: true,
  });

  res.status(200).json({
    success: true,
    message: "Logged out",
  });
});

// routes
app.use("/api/v1", userRouter);
app.use("/api/v1", productRouter);
app.use("/api/v1", mandiRouter);

app.use(globalErrorHandler);

module.exports = app;
