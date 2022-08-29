const fs = require('fs-extra');
const ejs = require('ejs');
const path = require('path');
const tempResetPassword = ejs.compile(fs.readFileSync(path.join(__dirname, 'forgot_password.ejs'), 'utf8'), { cache: true, filename: 'forgot_password.ejs' });
const tempSupport = ejs.compile(fs.readFileSync(path.join(__dirname, 'support.ejs'), 'utf8'), { cache: true, filename: 'support.ejs' });
const tempActive = ejs.compile(fs.readFileSync(path.join(__dirname, 'active.ejs'), 'utf8'), { cache: true, filename: 'active.ejs' });
const Constant = require('../../constant')
const { mailConfig } = Constant;
const nodeMailer = require('nodemailer')
const Promise = require('bluebird')
let transporter = nodeMailer.createTransport({
  // host: mailConfig.admin_email_domain,
  service: "Gmail",
  port: 465,
  secure: true,
  auth: {
    user: mailConfig.admin_email,
    pass: mailConfig.admin_email_password
  }
});
// let transporter = nodeMailer.createTransport({
//   port: 25,
//   host: 'localhost',
//   tls: {
//     rejectUnauthorized: false
//   },
// });

transporter.verify((e, success) => {
  if (e) {
    console.log('config mailer error', e)
  } else {
    console.log('config mailer success');
  }
})

function sendSupportEmail(data , callback){
  data = Object.assign({ url: mailConfig.urlFrontend }, data);
  return new Promise(async function (resolve, reject) {
    // setup email data with unicode symbols
    let mailOptions = {
      from: mailConfig.admin_email, // sender address
      to: data.to, // list of receivers
      replyTo: mailConfig.admin_email,
      subject: data.subject || 'Support Requesting!', // Subject line
      html: tempSupport(data) // html body
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log('send mail error: ' + JSON.stringify(error));
        return reject(error);
      }
      console.log('Message sent: %s', info.messageId);
      resolve(info);
    });
  }).asCallback(callback);
}

function sendEmailResetPassword(data, callback) {
  data = Object.assign({ url: mailConfig.urlFrontend }, data);
  return new Promise(async function (resolve, reject) {
    // setup email data with unicode symbols
    let mailOptions = {
      from: mailConfig.admin_email, // sender address
      to: data.to, // list of receivers
      replyTo: mailConfig.admin_email,
      subject: data.subject || 'Forgot Password Requesting!', // Subject line
      html: tempResetPassword(data) // html body
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log('send mail error: ' + JSON.stringify(error));
        return reject(error);
      }
      console.log('Message sent: %s', info.messageId);
      resolve(info);
    });
  }).asCallback(callback);
}

function sendEmailActive(data, callback) {
  data = Object.assign({ url: mailConfig.urlFrontend }, data);
  return new Promise(async function (resolve, reject) {
    let mailOptions = {
      from: mailConfig.admin_email,
      to: data.to,
      replyTo: mailConfig.admin_email,
      subject: data.subject || 'Active Email!',
      html: tempActive(data)
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log('send mail error: ' + JSON.stringify(error));
        return reject(error);
      }
      console.log('Message sent: %s', info.messageId);
      resolve(info);
    });
  }).asCallback(callback);
}




module.exports = {
  sendEmailResetPassword,
  sendEmailActive,
  sendSupportEmail,
}