var mg = require('nodemailer-mailgun-transport');
const nodemailer = require('nodemailer');
// const config = require('../config/main');
const config=require('./main')


var auth = {
  auth: {
    api_key: config.apiKey,
    domain: config.domain
  },
  
}
var nodemailerMailgun = nodemailer.createTransport(mg(auth));
 
exports.sendEmail = (recipient,sub,message,Response) => nodemailerMailgun.sendMail({
  from: config.MAIL_FROM,
  to: recipient, // An array if you have multiple recipients.
  subject: sub,
  //You can use "html:" to send HTML email content. It's magic!
  //html: value,
  //You can use "text:" to send plain-text content. It's oldschool!
  text: message
}, function (err, info) {
  if (err) {
    console.log('Error: ' + err);
  Response.send()
  }
  else {
    console.log('Response: ' + info);
  }
});