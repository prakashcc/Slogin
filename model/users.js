const mongoose = require("mongoose");
require("mongoose-type-email");
const joi = require("joi");

const usersSchema = mongoose.Schema({
    /*Common Fields*/
    id:mongoose.Schema.ObjectId,
    username:{type:String,lowercase:true},
    password:{type:String},
    first_name:{type:Number},
    last_name:{type:Number},
    user_email:{type: mongoose.SchemaTypes.Email,lowercase:true},
    mobile_number:{type:Number},
    date_of_birth:{type:Date},
    gender:{type:String},
    registration_date:{ type: Date, default: Date.now },
    profile_update:{ type: Date, default: Date.now },
    last_login:{ type: Date, default: Date.now },
    user_type:{ type: String },
    address:{type:String},
    smsverificationId:{type:String},
    smscode:{type:String},
    smsstate:{type:String},
    zipcode: {type:String},
    city:{type:String},
    state:{type:String},
    country:{type:String},
    height:{type:String},
    weight:{type:String},
    profilepictureUrl: {type:String},
    profileverify:{type:String},
    socialprovider:{type:String},
    socialmediaId:{type:String},
   
   
    
});

function validateUser(Users){
    const Schema = {
        user_email:joi.string().email().required(),
        password:joi.string().min(5).max(255).required()
    }
}

const UsersModel = mongoose.model("Users",usersSchema);
module.exports = UsersModel;

