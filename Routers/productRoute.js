const { createProduct, getProductFromCity, getAllProduct, getProduct, updateProduct, addImage, deleteProduct, deleteImage, getUserProduct } = require("../Controler/product");
const authenticateToken = require('../Middleware/authUser');
const openAI = require("../utils/openai");

const router = require("express").Router();

router.route('/products').post( authenticateToken, createProduct).get( getAllProduct);
router.route('/product/:id').get(getProduct).put( authenticateToken, updateProduct).delete( authenticateToken, deleteProduct);
router.route('/my-product').get(authenticateToken, getUserProduct);

module.exports = router;
