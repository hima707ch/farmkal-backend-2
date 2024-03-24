const cloudinary = require("cloudinary").v2;

const uploadImageToCloudinary = async (img, model, folder, isProduct) => {
  try {
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: folder, width: 150, crop: "scale" },
          (error, result) => {
            if (error) {
              console.error("Error uploading image:", error);
              reject(error);
            } else {
              console.log("Image uploaded successfully:", result);
              resolve(result);
            }
          },
        )
        .end(img.data);
    });

    if (isProduct) {
      model.images.push({
        public_id: result.public_id,
        url: result.secure_url,
      });
    } else {
      model.avatar = {
        public_id: result.public_id,
        url: result.secure_url,
      };
    }

    const resp = await model.save();
    console.log(resp);
  } catch (err) {
    console.log("Error uploading image");
    console.log(err);
  }
};

module.exports = uploadImageToCloudinary;
