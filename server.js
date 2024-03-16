const dotenv = require("dotenv").config({ path: "config/.env" });
const connectDB = require("./database");
const cloudinary = require("cloudinary");

const { server } = require("./Chat/chat");

const { log } = require("console");

connectDB();

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

let port = process.env.PORT || 4000;

server.listen(port, () => {
  `server is running on port ${process.env.PORT}`;
});
