const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
var passport = require("passport");
const randomstring = require("randomstring");
const ejs = require("ejs");
const config = require("../config/main");
const mailgun = require("mailgun-js")({apiKey: config.apiKey, domain: config.domain});
var passportconf = require("../config/passport");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const UsersModel =  require("../models/users");
const elasticsearch = require("elasticsearch");
const Multer =require("multer");
const imgUpload = require('../middleware/imageUpload');

 const fileFilter = (req, file, cb) =>{
     if(file.mimetype === "image/jpeg" || file.mimetype === "image/png"){
         cb(null,true);
     }
     else{
         cb(new Error("Only .jpg and .png filetype is allowed"), false);
     }
 } 


// var multipleUpload = multer({ storage: storage,limits:{
//     fileSize:1024 * 1024 * 5
// },fileFilter:fileFilter }).array("file");

const multer = Multer({
  storage: Multer.MemoryStorage,
  fileSize: 5 * 1024 * 1024,
  fileFilter:fileFilter
});
    
var decodeToken = function(req){
  let token = req.headers["authorization"];
  var author;
  if (!token) return res.status(401).send({ auth: false, message: "No token provided." });
      
  jwt.verify(token, config.JWT_SECRET, function(err, decoded) {
      if (err) return res.status(500).send({ auth: false, message: "Failed to authenticate token." });
     author =  decoded;
  });
  return author;
}

/* GET users listing. */
router.get("/getalluser",passport.authenticate("jwt", { session: false }),async function(req, res, next) {
    try {
        let user = await UsersModel.find({user_type:"User"}); 
        if(user) return res.send({status:"true",message:"All User",data:user,token:null});
        if(!user) return res.send({status:"false",message:"No User Available in Database",data:null,token:null});
      } catch (error) {
          return res.send({status:"false",message:"Unsucessfull Server Error Occured",data:error,token:null}); 
      } 
});


router.get("/getoneuser/:id",passport.authenticate("jwt", { session: false }),async function(req, res, next){
    try {
        let users = await UsersModel.findOne({_id:req.params.id});
        if(users) return res.send({status:"true",message:"User Found",data:users,token:null});
        if(!users) return res.send({status:"false",message:"No User Available in Database",data:null,token:null});
      } catch (error) {
          return res.send({status:"false",message:"Unsucessfull Server Error Occured",data:error,token:null}); 
      }  
});



router.patch("/updateuser/:user_email",passport.authenticate("jwt", { session: false }),async function(req, res, next){
    try {
        let dt = new Date();
    let user = await UsersModel.findOne({$and:[{user_email:req.params.user_email},{user_type:"User"}]});  
    if (!user) return res.send({status:"false",message:"No User Available in Database",data:null,token:null});
    user.first_name = req.body.first_name,
    user.last_name = req.body.last_name,
    user.mobile_number=req.body.mobile_number,
    user.date_of_birth=req.body.date_of_birth,
    user.height=req.body.height,
    user.weight=req.body.weight,
    user.gender=req.body.gender,
    user.username=req.body.username
    user.city = req.body.city ,
    user.zipcode = req.body.zipcode,
    user.state = req.body.state,
    user.country = req.body.country,
    user.profile_update = dt,
    user.approve = "Form Submitted"
    
    const result = await user.save();
    if(result){
        let message = await ejs.renderFile("./views/emailtemplates/updating-form.ejs",{ name: result.first_name});
        let data = {
        from: config.MAIL_FROM,
        to: result.user_email,
        cc:config.MAIL_FROM,
        subject: "Profile Updated Sucessfully",
        html: message
      }  
      mailgun.messages().send(data, (error, body) => {
        if(error){
            console.log(error);
        res.send({status:true,message:"Profile Updated Sucessfully But Email Not Send",data:null,token:null});
        }
        console.log(body);
        res.send({status:true,message:"Profile Updated Sucessfully Email Send",data:null,token:null});
      });
      
    } 
      else{
        return res.send({status:false,message:"Update Unsucessfull",data:null,token:null});  
    }
    
    //console.log(result); 
    } catch (error) {
        return res.send({status:"false",message:"Unsucessfull Server Error Occured",data:error,token:null});
    }
    
      
})


router.patch("/forgetpassword/:user_email",async function(req, res, next){
    try {
        let user = await UsersModel.findOne({user_email:req.params.user_email,user_type:"User"});
      if(!user) return res.send({status:"false",message:"No User Available in Database",data:null,token:null});
        let newpassword = randomstring.generate();
        console.log(newpassword);
       // let approvestatus = false; 
      //  let user = await UsersModel.findOne({work_email:req.params.work_email});
  //  console.log(user[1])   
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newpassword,salt);  
    user.password = hash;
      //  user.verifykey = token;
     const result = await user.save();
     if(result){
        let message =  await ejs.renderFile("./views/emailtemplates/forget-password-reset.ejs",{ name: result.first_name, password:newpassword});
        let data = {
        from: config.MAIL_FROM,
        to: req.params.user_email,
        cc:config.MAIL_FROM,
        subject:"Account New Password",
        html: message
      }  
      console.log("print next to data");
      console.log(data);
      mailgun.messages().send(data, (error, body) => {
          console.log("email going to print");
        if(error){
        console.log(error);
        res.send({status:true,message:"Account Password Reset Sucessfull But Email Not Send",data:error,token:null});
        }
        console.log(body);
        res.send({status:true,message:"Account Password Reset Sucessfull Email Send",data:body,token:null});
      });
    }
    else{
        return res.send({status:"false",message:"Account Password Reset Failed",data:error,token:null});
    }
 
    // console.log(result); 
    } catch (error) {
        return res.send({status:"false",message:"Unsucessfull Server Error Occured",data:error,token:null});
    }
    
})

router.patch("/forgetpasswordchange",passport.authenticate("jwt", { session: false }),async function(req, res, next){
    try {
        let user = await UsersModel.findOne({user_email:req.body.user_email,user_type:"User"});
      if(!user) return res.send({status:"false",message:"No User Available in Database",data:null,token:null});
      
      const validpassword = await bcrypt.compare(req.body.old_password,user.password);
      if (!validpassword) return res.send({status:"false",message:"Invalid username or password",data:null,token:null});  
      let newpassword = req.body.password; 
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newpassword,salt);  
    user.password = hash;
      //  user.verifykey = token;
     const result = await user.save();
     if(result){
        let message =  await ejs.renderFile("./views/emailtemplates/forget-password-change.ejs",{ name: result.first_name});
        let data = {
        from: config.MAIL_FROM,
        to: result.user_email,
        cc:config.MAIL_FROM,
        subject:"Account New Password",
        html: message
      }  
      console.log("print next to data");
      mailgun.messages().send(data, (error, body) => {
          console.log("email going to print");
        if(error){
        console.log(error);
        res.send({status:true,message:"Account Password Reset Sucessfull But Email Not Send",data:error,token:null});
        }
        console.log(body);
        res.send({status:true,message:"Account Password Reset Sucessfull Email Send",data:body,token:null});
      });
    }
    else{
    return res.send({status:"false",message:"Account Password Reset Failed",data:error,token:null});
    }
    // console.log(result); 
    } catch (error) {
        return res.send({status:"false",message:"Unsucessfull Server Error Occured",data:error,token:null});
    }
    
});
    
   function bcryptsalt(){
    const salt = bcrypt.genSalt(10); 
   }

//   var imagefile = upload.fields([{ name: "profileimage", maxCount: 1 },{ name: "placeimage", maxCount: 1 },{ name: "attachment", maxCount: 3 }]);
// router.patch("/storeimage/:user_email",imagefile,async function(req,res,next){
//     try {
//         let member = await UsersModel.findOne({user_email:req.params.user_email});
//         //console.log(req.body);
//         if(member){
//         let imageview = req.files;
//         console.log(imageview)
//       if(imageview){
//         //member.profilepictureUrl =  imageview.profileimage[0]["path"],
//         //member.publicprofileUrl = imageview.placeimage[0]["path"]
//         console.log(member._id);
//         let imageresult = await UsersModel.findOneAndUpdate({_id:member._id},{ $set : {profilepictureUrl:imageview.profileimage[0]["path"]}})
//         if(imageresult){
//             res.send({status:true,message:"File Upload Sucessfull",data:imageresult,imagedetails:imageview,token:null});
//         }
//         else{
//             res.send({status:false,message:"File Upload Sucessfull But Not Saved",data:imageresult,imagedetails:imageview,token:null});
//         }
       
//     }
//     else{
//         res.send({status:false,message:"File Upload Unsucessfull",data:imageview,token:null});  
//         console.log(imageview);
//    }
// }       
//     } 
//     catch (error) {
//         return res.send({status:"false",message:"Unsucessfull Server Error Occured",data:error,token:null});
//     }
//  });                 

    

router.delete("/deleteuser",passport.authenticate("jwt", { session: false }),async function(req, res, next) {
    try {
      var author = decodeToken(req);
      logeduser = mongoose.Types.ObjectId(author.sub); 
      console.log(logeduser);
        let users = await UsersModel.findOne({_id:logeduser});
        if(users){ 
          console.log(users);
            let dt = await UsersModel.deleteOne(users);
            return res.send({status:"true",message:"User Deleted Sucessfull",data:dt,token:null});
          } 
        if(!users) return res.send({status:"false",message:"No User Available in Database",data:null,token:null});
    //return res.status(200).json({message:"user deleted"})
    } catch (error) {
      return res.send({status:"false",message:"Unsucessfull Server Error Occured",data:error,token:null});
    }
    
});

router.patch("/updateoneuser",multer.single('event_image'), imgUpload.uploadToGcs,passport.authenticate("jwt", { session: false }),async function(req, res, next){
  try {
      let dt = new Date();
      var author = decodeToken(req);
      logeduser = mongoose.Types.ObjectId(author.sub); 
      console.log(req.params.id);
  let user = await UsersModel.findOne({_id:logeduser});
  console.log(user); 
  if (!user){
    return res.send({status:"false",message:"No User Available in Database",data:null,token:null});
  }
  const data = request.files;
  
if (request.file && request.file.cloudStoragePublicUrl) {
    data.imageUrl = request.file.cloudStoragePublicUrl;
    user.profilepictureUrl = data.imageUrl
    let updatepicture = await user.save();
  }
  
 

  if(req.body.mobile_number){
    if(req.body.mobile_number == user.mobile_number ){
  user.mobile_number = user.mobile_number,
  user.profile_update = dt
  const result = await user.save();
    }
    else{
    let mobile = await UsersModel.findOne({mobile_number:req.body.mobile_number});
    if(mobile){
      return res.send({status:"false",message:"Mobile Number Exists",data:mobile,token:null});
    } 
    user.mobile_number = req.body.mobile_number, 
    user.profile_update = dt
    const result = await user.save();
    console.log(result);
    //return res.send({status:true,message:"Update sucessfull",data:result,token:null}); 
  }
}

else if(req.body.user_email){
  if(req.body.user_email == user.user_email ){
user.user_email = user.user_email,
user.profile_update = dt
const result = await user.save();
console.log(result);
  }
  else{
  let mobile = await UsersModel.findOne({user_email:req.body.user_email});
  if(mobile){
    return res.send({status:"false",message:"Email ID Exists",data:mobile,token:null});
  } 
  user.user_email = req.body.user_email, 
  user.profile_update = dt
  const result = await user.save();
  console.log(result);
  //return res.send({status:true,message:"Update sucessfull",data:result,token:null}); 
}
}

  user.height=req.body.height,
  user.first_name = req.body.first_name,
  user.last_name = req.body.last_name,
  user.weight=req.body.weight,
  user.username=req.body.username,
  user.city = req.body.city ,
  user.gender = req.body.gender,
  user.country = req.body.country,
  user.state = req.body.state,
  user.zipcode = req.body.zipcode,
  user.profile_update = dt,
  user.date_of_birth = req.body.date_of_birth,
  user.approve = "Form Submitted"
  const result = await user.save();
 // return res.send({status:true,message:"Update sucessfull",data:result,token:null}); 
 
  if(result){
      let message = await ejs.renderFile("./views/emailtemplates/updating-form.ejs",{ name: result.first_name});
      let data = {
      from: config.MAIL_FROM,
      to: result.user_email,
      cc:config.MAIL_FROM,
      subject: "Profile Updated Sucessfully",
      html: message
    }  
    mailgun.messages().send(data, (error, body) => {
      if(error){
          console.log(error);
      res.send({status:true,message:"Profile Updated Sucessfully But Email Not Send",data:null,token:null});
      }
      console.log(body);
      res.send({status:true,message:"Profile Updated Sucessfully Email Send",data:null,token:null});
    });
    
  } 
    else{
      return res.send({status:false,message:"Update Unsucessfull",data:null,token:null});  
  }

  } 
  catch (error) {
      return res.send({status:"false",message:"Unsucessfull Server Error Occured",data:error,token:null});
  }
  
    
})



module.exports = router;
