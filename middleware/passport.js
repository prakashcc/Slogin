const passport = require('passport');
var randomstring = require("randomstring");
const jwt = require('jsonwebtoken');
var LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const { ExtractJwt } = require('passport-jwt');
const LocalStrategy = require('passport-local').Strategy;
// const config = require('../config/main');
const config = require('./main');
const UsersModel = require('../models/users');
const FacebookStrategy = require('passport-facebook').Strategy;

// JSON WEB TOKENS STRATEGY
passport.use('jwt',new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromHeader('authorization'),
  secretOrKey: config.JWT_SECRET
}, async (payload, done) => {
  try {
    // Find the user specified in token
    const user = await UsersModel.findById(payload.sub);

    // If user doesn't exists, handle it
    if (!user) {
      return done(null, false);
    }

    // Otherwise, return the user
    done(null, user);
  } catch(error) {
    done(error, false);
  }
}));





passport.use(new GoogleStrategy({
  clientID: config["google.clientID"],
  clientSecret: config["google.clientSecret"],
  callbackURL: config["google.callbackURL"],
  passReqToCallback   : true
},
async function(request, accessToken, refreshToken, profile, done) {
 
// console.log(profile);
// return done(null)
try {
  let googleuser =  await UsersModel.findOne({user_email:profile.emails[0].value});

  if(googleuser){
  
  let googleusertoken = await jwt.sign(
    {
    iss:'BetterHealth',
    sub: googleuser._id,
    iat: new Date().getTime(),
    exp: new Date().setDate(new Date().getDate()+1) 
}, 
config.JWT_SECRET
);
console.log('user in database'+ googleusertoken +'ending here');
return done(null,googleusertoken);
}
 let newgoogleusein = await new UsersModel({
    socialprovider:'google',
    socialmediaId:profile.id,
    first_name:profile.name.givenName,
    last_name:profile.name.familyName,
    user_email:profile.emails[0].value,
    work_email:profile.emails[0].value,
    profilepictureUrl:profile.photos[0].value
}).save();
console.log(newgoogleusein._id);
let googleusertoken = jwt.sign(
  {
  iss:'BetterHealth',
  sub: newgoogleusein._id,
  iat: new Date().getTime(),
  exp: new Date().setDate(new Date().getDate()+1) 
}, 
config.JWT_SECRET
);
//console.log(googleusertoken);
//console.log('New User Created');
return done(null,googleusertoken);


//console.log("checing output" + newgoogleusein);


//return done(null,newgoogleusein)

} catch (error) {
  return done(error,false);
}
} 
));

passport.use('facebook',new FacebookStrategy({
  clientID: "199699944044838",
  clientSecret: "f0c51b8002c2b4657df4a074a3505f68",
  callbackURL: "http://localhost:3000/auth/facebook/callback"
},
function(accessToken, refreshToken, profile, cb) {
  // User.findOrCreate({ facebookId: profile.id }, function (err, user) {
  //   return cb(err, user);
  // });
  console.log(profile);
  // try {
  //   let faceuser = await UsersModel.findOne({ googleId: profile.id });
  //   if(!faceuser){
  //     new UsersModel({
  //       googleId:profile.id,
  //       first_name:profile.name.givenName,
  //       last_name:profile.name.familyName,
  //       user_email:profile.email
  //   }).save();
  //   const tokens = await jwt.sign(
  
  //     {
  //     iss:'BetterHealth',
  //     sub: googleuser._id,
  //     iat: new Date().getTime(),
  //     exp: new Date().setDate(new Date().getDate()+1) 
  // }, 
  // config.JWT_SECRET
  // );
  //      console.log("User Saved To Database :-"+googleuser);
  //      console.log(tokens);
  //   }
  //   else{
  //     const tokens = await jwt.sign(
  
  //       {
  //       iss:'BetterHealth',
  //       sub: googleuser._id,
  //       iat: new Date().getTime(),
  //       exp: new Date().setDate(new Date().getDate()+1) 
  //   }, 
  //   config.JWT_SECRET
  //   );
  //      console.log("User Available In System"+  tokens);
    
  //   }
  //  } catch (error) {
  //    console.log(error);
     
  //  }
}
));


passport.use(new LinkedInStrategy({
  clientID: '817ojxeajf04hh',
  clientSecret: 'TpD6Q6WqhA8X5sEH',
  callbackURL: "http://localhost:8888/auth/linkedin/callback",
  scope: ['r_emailaddress', 'r_liteprofile'],
  //state: true
}, function(accessToken, refreshToken, profile, done) {
  // asynchronous verification, for effect...
 // req.session.accessToken = accessToken;
  process.nextTick(function () {
    // To keep the example simple, the user's LinkedIn profile is returned to
    // represent the logged-in user. In a typical application, you would want
    // to associate the LinkedIn account with a user record in your database,
    // and return that user instead.
   console.log(profile);
   return done(null, "Done");
  });
}));