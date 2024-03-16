
const mongoose = require('mongoose');
const validator = require("validator");
const bcrypt = require('bcryptjs')

const productSchema = mongoose.Schema({

    // Send by seller
    name : {
        type : String,
        // required : [true , "Please enter name"]
    },
    description : {
        type : String,
        // required : [true, "Please enter description"]
    },
    price : {
        type : String,
        // required : [true, "Please enter Price"],
        maxLength : [9, "exceeds limit"]
    },
    category : {
        type : String,
        // required : [true, "Please enter category"]
    },
    lattitude : {
        type : Number,
    },
    longitude : {
        type : Number,
    },
    special : {},
    score : {
        type : Number
    },
    images : [
        {
            public_id : {
                type : String,
                //required : true
            },
            url : {
                type : String,
                //required : true
            }
        }
    ],
    // 

    // Send by visitors
    reviews : [
        {
            user : {
                type : mongoose.Schema.ObjectId,
                ref : "User"
            },
            name : {
                type : String,
                required : true
            },
            rating : {
                type : Number,
                required : true
            },
            comment : {
                type : String,
                required : true
            },
        }
    ],
    numOfRevies : {
        type : Number,
        default : 0
    },

    // calculated at backend
    state : {
        type : String,
    },
    city : {
        type : String
    },
    seller : {
        type : mongoose.Schema.ObjectId,
        ref : 'User',
        //required : [true, "Please mention seller"]       comment for test
    },
    rating : {
        type : Number,
        default : 0
    },

    // categories

    // for tractor

    model : String,
    brand : String,
    tyre : String,
    hours : String,

    createdAt : {
        type : Date,
        default : Date.now()
    }
})

productSchema.pre('save',function(next){

    console.log("in save")

    if(this.isModified('reviews')){
        this.numOfRevies = this.reviews.length;
    }

    this.score = Object.keys(this.toObject()).length + this.images.length + this.reviews.length;
    
    next();
})

productSchema.index({city :1, category : 1, score : -1});
productSchema.index({city :1, score : -1 });


const Product = mongoose.model('Product',productSchema);

module.exports = Product;