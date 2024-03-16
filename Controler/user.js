const User = require("../Models/user");
const ChatData = require("../Models/chatting");
const sendToken = require("../utils/jwtAuth");
const CustomError = require("../utils/CustomError");
const uploadImageToCloudinary = require("../utils/uploadImage");
const ApiFeatures = require("../utils/ApiFeatures");
const bcryptjs = require("bcryptjs");
const { default: mongoose } = require("mongoose");

const create = async (req, res, next) => {
  try {
    console.log(req.files);

    const {
      name,
      email,
      username,
      password,
      photoUrl,
      phone,
      bio,
      latitude,
      longitude,
      state,
      city,
    } = req.body;

    const userData = {
      name,
      email,
      username,
      password,
      photoUrl,
      phone,
      bio,
      latitude,
      longitude,
      state,
      city,
    };

    user = await User.create(userData);

    if (!user) {
      return next(new CustomError("Error creating user", 500));
    }

    // uploading image
    if (user && req.files && req.files.avatar) {
      uploadImageToCloudinary(req.files.avatar, user, "Farmkal/Users", false);
    }

    sendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

const updateUser = async (req, res, next) => {
  try {
    console.log("c or up user", req.body);

    const { id } = req.params;

    const { name, photoUrl, bio, latitude, longitude, state, city } = req.body;

    const data = {
      name,
      photoUrl,
      bio,
      latitude,
      longitude,
      state,
      city,
    };

    let user = await User.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
      useFindAndModify: true,
    });

    if (!user) {
      return next(new CustomError("Erro creating user"));
    }

    if (user && req.files && req.files.avatar) {
      uploadImageToCloudinary(req.files.avatar, user, "Farmkal/Users", false);
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, phone } = req.body;

    // console.log(req.body);

    if (email || phone) {
      const uniqueId = email || phone;

      // console.log(uniqueId);

      let user = await User.findOne({
        $or: [{ email: uniqueId }, { phone: uniqueId }],
      });

      if (!user) {
        return next(new CustomError(`${email || phone} not exist`, 200));
      }

      if (user) {
        sendToken(user, 200, res);
        return;
      }
    }

    const { username, password } = req.body;

    if (!username || !password) {
      return next(new CustomError("Username or password missing", 400));
    }

    user = await User.findOne({ username });

    if (!user) {
      return next(new CustomError("Invalid username or password", 400));
    }

    const isPasswordMatch = await bcryptjs.compare(password, user.password);

    if (!isPasswordMatch) {
      return next(new CustomError("Invalid username or password", 400));
    }

    delete user.password;

    sendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

const myDetails = async( req, res,next )=>{
  const user = await User.findById( req.user.id );

  if(!user){
    return next( new CustomError('Invalid user' , 200) );
  }

  res.status(200).json({
    success : true,
    user
  })

}

const updateCart = async( req,res, next ) =>{
  try{
    const user = await User.findById(req.user.id);

    console.log('update cart, body', req.body)

    if(req.body.type === 'add'){
      user.cart.push({
        productId : req.body.productId,
        quantity : req.body.quantity || 1
      })
    }
    if(req.body.type === 'quantity'){
      for(const element of user.cart){
        if(element.productId === req.body.productId){
          element.quantity = req.body.quantity;
          break;
        }
      };
    }
    if(req.body.type === 'remove'){
      console.log('in remove cart')
      user.cart = user.cart.filter( (ele)=>{
        let prod_id = new mongoose.Types.ObjectId( req.body.productId );

        if(ele.productId.equals(prod_id)) {console.log('in false'); return false;}
        return true;
      } )
    }

    console.log('user cart',user);
    await user.save();

    req.user = user;

    res.status(201).json({
      success : true,
      user
    })

  }
  catch(err){
    next(err);
  }
}

const getChatUserList = async (req, res, next) => {
  console.log("get chat list called");
  try {
    console.log(req.body);

    const myAllChat = await ChatData.findOne({ me: req.user.id });

    if (!myAllChat) {
      res.status(200).json({
        success: true,
        message: "No chat exist",
        emailList: [],
      });
      return;
    }

    const keys = Object.keys(myAllChat);

    const nameWithEmailArray = []; // result

    for (var uniqueId of keys) {
      console.log("uniqueId ", uniqueId);

      if (!Array.isArray(myAllChat[uniqueId])) continue;

      const user = await User.findById(uniqueId)
        .select("name email phone username")
        .exec();

      if (!user) {
        console.log("PROD ERROR : A user without Reistration using chat");
        continue;
      }

      console.log("user", user, user.name);

      nameWithEmailArray.push({
        email: user.email,
        ObjId: uniqueId,
        name: user.name,
        phone: user.phone,
      });
    }

    res.status(200).json({
      success: true,
      emailList: nameWithEmailArray,
    });
  } catch (err) {
    next(err);
  }
};

const getChatData = async (req, res, next) => {
  console.log("get chat data called");

  try {
    console.log(req.body);

    let friendId = req.params.id;

    const chat = await ChatData.findOne({ me: req.user.id })
      .select(friendId)
      .exec();

    if (!chat) {
      res.status(200).json({
        success: true,
        message: "No chat exist",
        chatData: [],
      });
      return;
    }

    res.status(200).json({
      success: true,
      chatData: chat[friendId] || [],
    });
  } catch (err) {
    console.log(err);
  }
};

const sellItems = async (req, res, next) => {
  const user = await User.findById(req.user.id).populate("sellItems");

  const products = user.sellItems;

  res.status(200).json({
    success: true,
    sellItems,
  });
};

// Admin route

const getAllUser = async (req, res, next) => {
  try {
    const apifeatures = new ApiFeatures(User.find(), req.query, "user")
      .filter()
      .sort()
      .paginate();
    const users = await apifeatures.query;

    res.status(200).json({
      success: true,
      users,
    });
  } catch (err) {
    next(err);
  }
};

const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  create,
  updateUser,
  updateCart,
  login,
  getChatUserList,
  getChatData,
  getAllUser,
  getUser,
  myDetails
};
