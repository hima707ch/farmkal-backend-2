const Product = require("../Models/product");
const ApiFeatures = require("../utils/ApiFeatures");
const CustomError = require("../utils/CustomError");
const uploadImageToCloudinary = require("../utils/uploadImage");
const shuffleArray = require("../utils/ArrayFeatures");
const { citiesData } = require("../utils/data");
const cloudinary = require("cloudinary").v2;
const log = console.log;

const createProduct = async (req, res, next) => {
  try {
    log("req.body", req.body);

    const {
      name,
      description,
      price,
      category,
      latitude,
      longitude,
      state,
      city,
      special,
    } = req.body;

    const productData = {
      name,
      description,
      price,
      category,
      latitude,
      longitude,
      state,
      city,
      special: JSON.parse(special),

      seller: req.user.id,
    };

    const product = await Product.create(productData);

    let images;
    let imageArray;

    if (req.files != null && req.files.images != null) {
      images = req.files.images;
      imageArray = Array.isArray(images) ? images : [images];
    }

    res.status(200).json({
      success: true,
      product,
    });

    if (product) {
      if (imageArray) {
        for (const img of images) {
          await uploadImageToCloudinary(img, product, "Farmkal/Products", true);
          console.log("uploaded 1 img");
        }
      }
    }
  } catch (err) {
    return next(err);
  }
};

const getAllProduct = async (req, res, next) => {
  try {
    req.query.sort = "-score";
    console.log(req.query);

    let apifeatures = new ApiFeatures(Product.find(), req.query, "product")
      .filter()
      .sort()
      .paginate();

    let products = await apifeatures.query;

    let count = products.length;
    let moreProducts;

    // search more product
    if (req.query.city && (count < 30 || req.query.sugg == "true")) {
      let nearByCity = [];

      req.query.city = req.query.city.toLowerCase();

      const myCity = citiesData.filter((ele) => {
        if (ele.city == req.query.city) {
          return true;
        }
      });

      if (myCity.length == 0) {
        res.status(200).json({
          success: true,
          products,
          message: "No suggestion, city not exist for suggestion",
        });
        return;
      }

      myLatitude = myCity[0].latitude;
      myLongitude = myCity[0].longitude;

      citiesData.map((ele) => {
        if (ele.city == myCity[0].city) return;
        if (
          ele.latitude < myLatitude + 1 &&
          ele.latitude > myLatitude - 1 &&
          ele.longitude < myLongitude + 1 &&
          ele.longitude > myLongitude - 1
        ) {
          nearByCity.push(ele.city);
        }
      });

      req.query.city = { $in: [...nearByCity] };

      apifeatures = new ApiFeatures(Product.find(), req.query)
        .filter()
        .sort()
        .paginate();

      moreProducts = await apifeatures.query;
    }

    res.status(200).json({
      success: true,
      products,
      moreProducts,
    });
  } catch (err) {
    next(err);
  }
};

const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return next(new CustomError("No product", 200));
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (err) {
    next(err);
  }
};

// PRoduct of a particular user
const getUserProduct = async (req, res, next) => {
  try {
    let product = await Product.find({ seller: req.user.id });

    console.log("m prod", product);
    res.status(200).json({
      success: true,
      product,
    });
  } catch (err) {
    next(err);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return next(new CustomError("No product found", 400));
    }

    const {
      name,
      description,
      price,
      category,
      latitude,
      longitude,
      state,
      city,

      // for tractor
      model,
      brand,
      tyre,
      hours,

      delete_public_id,
    } = req.body;

    const data = {
      name,
      description,
      price,
      category,
      latitude,
      longitude,
      state,
      city,

      // for tractor
      model,
      brand,
      tyre,
      hours,
    };

    product = await Product.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });

    if (!product) {
      return next(new CustomError("No product found", 400));
    }

    if (req.files && req.files.images) {
      console.log(req.files, req.files.images);
      uploadImageToCloudinary(
        req.files.images,
        product,
        "Farmkal/Products",
        true,
      );
    }

    if (delete_public_id) {
      let is_deleted;
      console.log(is_deleted, delete_public_id);

      console.log("prod . images", product.images);

      product.images = product.images.filter((image) => {
        if (image.public_id == delete_public_id) {
          is_deleted = true;
          return false;
        }
        return true;
      });

      console.log("prod . images", product.images);

      await product.save();

      if (is_deleted) {
        await cloudinary.uploader.destroy(delete_public_id, (error, result) => {
          if (error) {
            console.error("Error deleting image:", error);
          } else {
            console.log("Image deleted successfully:", result);
          }
        });
      }
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (err) {
    next(err);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const id = req.params.id;

    const resp = await Product.findByIdAndDelete(id);

    if (!resp) {
      return next(new CustomError("No product Found", 200));
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createProduct,
  getAllProduct,
  getProduct,
  updateProduct,
  deleteProduct,
  getUserProduct,
};
