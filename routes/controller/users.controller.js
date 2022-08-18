
const BaseController = require('./base.controller')
const Constant = require('../../constant')
const fs = require('fs-extra')
const UserModel = require('../../database/User')
const LoginModel = require('../../database/Login')
var moment = require('moment')
const NotificationModel = require('../../database/Notification')
var Utility = require('../../utility')
var ErrorCode = require('../../error_code')
const debug = require('debug')('truck')
var moment = require('moment')
var Mongoose = require('mongoose')
const NotificationUtils = require( '../../utils/notification.utils')
const request = require('request');
const axios = require('axios');
const mailController = require('../../utils/mail_controller');
const jwt = require('jsonwebtoken');

class UserController extends BaseController {
    static index(req, res) {
        BaseController.generateMessage(res, 0, 1, 200)
    }

    static login(req, res) {
        debug(req.body)
        var body = req.body;
        var deviceInfo = {};
        var isWeb = 0;
        if (typeof body.loginData != 'undefined' && body.loginData.device == 0) {
            isWeb = 1;
        }


        var username = req.body.username
        username = username ? username.toLowerCase() : '';
        var password = req.body.password;
        // account info
        if (!username || !password) return BaseController.generateMessage(res, ErrorCode.MissingParams(req.body))
        // check login
        return UserModel.findOne({ $or: [{ username: username }, { email: username }, { phoneNumber: username }] }, function (error, user) {
            if (error) return BaseController.generateMessage(res, error);
            if (user == null) return BaseController.generateMessage(res, ErrorCode.UserNotFound);
            if (user.role == UserModel.getUserRole().Banned) return BaseController.generateMessage(res, ErrorCode.UserBanned);
            if (user.password != Utility.createPassword(password)) return BaseController.generateMessage(res, ErrorCode.PasswordIncorrect);
            UserController.createNewSession(req, res, user._id, { accessToken: body.accessToken, fcmToken: body.fcmToken, device: body.device })
        })
    }

    static getUserAvatar(req,res){
        UserModel.findOne({_id:req.parsedData.userId }).then(user=>{
            if(user == null){
                return BaseController.generateMessage(res, 'not found')
            }
            if(user.avatar&&user.avatar.length > 0){
                res.redirect(user.avatar);
            }else{
                res.sendFile(Constant.rootFolder +'/render_resource/' + 'null_circle_avatar.png');
            }
        }).catch(err=>{
            // BaseController.generateMessage(res, 'not found')
            res.sendFile(Constant.rootFolder +'/render_resource/' + 'null_circle_avatar.png');
        })
    }

    static signup(req, res) {
        debug(req.body)
        var body = req.body;

        // if (typeof req.body.deviceInfo == 'undefined' || typeof req.body.device == 'undefined') {
        //     BaseController.generateMessage(res, ErrorCode.MessageWithoutTranslation('Version app bạn sử dụng đã cũ, vui lòng cập nhật phiên bản mới'));
        //     return;
        // }
        // var deviceInfo = req.body.deviceInfo;
        // if (req.body.deviceInfo.device == 1 || req.body.deviceInfo.device == 2) {

        //     var version = Utility.getVersionApp();
        //     if (typeof deviceInfo.appVersion == 'undefined' || deviceInfo.appVersion < version.lastest_version) {
        //         BaseController.generateMessage(res, ErrorCode.MessageWithoutTranslation('Version app bạn sử dụng đã cũ, vui lòng cập nhật phiên bản mới'));
        //         return;
        //     }

        //     if (typeof deviceInfo.uuid == 'undefined' || deviceInfo.uuid.length < 2) {
        //         BaseController.generateMessage(res, ErrorCode.MessageWithoutTranslation('Không xác thực được thiết bị, vui long kiểm tra lại thiết bị hiện hành.'));
        //         return;
        //     }
        // }

        if (!body.email || body.email.indexOf('@') < 0 || body.email.indexOf('.') < 0) {
            return BaseController.generateMessage(res, ErrorCode.InvalidEmail)
        }

        if (!body.password || body.password.length < 6) {
            return BaseController.generateMessage(res, ErrorCode.InvalidPassword)
        }

        debug('signup', body);

        return UserModel.createUserWithEmail(body, function (error, user) {
            if (error) return BaseController.generateMessage(res, error);
            req.user = user;
            UserController.createNewSession(req, res, user._id, { accessToken: body.accessToken, fcmToken: body.fcmToken, device: body.device });
        })
    }

    static signupWithPhone(req, res ){
        let body = req.body
        var deviceInfo = {};
        if (!body.phoneNumber) {
            return BaseController.generateMessage(res, ErrorCode.InvalidEmail)
        }

        if (!body.password || body.password.length < 6) {
            return BaseController.generateMessage(res, ErrorCode.InvalidPassword)
        }

        debug('signup', body);
        return UserModel.findOne({phoneNumber: body.phoneNumber }).then(userExist=>{
            if(userExist== null){
                return UserModel.create({phoneNumber: body.phoneNumber , password: Utility.createPassword(body.password)}, function (error, user) {
                    if (error) return BaseController.generateMessage(res, error);
                    req.user = user;
                    UserController.createNewSession(req, res, user._id, { accessToken: body.accessToken, fcmToken: body.fcmToken, device: body.device });
                })
            }else{
                return BaseController.generateMessage(res, ErrorCode.InvalidEmail)
            }
        })
        
    }

    static updateFcmToken(req,res){
        LoginModel.updateOne({ token: req.parsedData.token }, { $set: { fcmToken:req.parsedData.fcmToken } }, { new: true }, function (err, login) {
            if (err) {
                BaseController.generateMessage(res, err);return;
            }
            BaseController.generateMessage(res, 0, login );
        })
    }


    static logout(req, res, next) {
        delete req.session.token;
        BaseController.generateMessage(res, 0, new Date());
        LoginModel.updateOne({ token: req.token }, { $set: { isExpired: 1 } }, { new: true }, function (err, login) {
            if (!err) {
                socketApi.logout(req.user, login ? login.fcmToken : ' ');
            }
        })
        req.logout();
    }

    static loginGoogleWithAccessToken(req, res) {
        var body = req.body;
        let accessToken = body.accessToken;
        let idToken = body.idToken;
        if (!accessToken) return BaseController.generateMessage(res, ErrorCode.MissingParams({ message: 'access token required', field: 'accessToken' }));
        return axios.get(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${accessToken}`,
            {
                headers: {
                Authorization: `Bearer ${idToken}`,
                },
            }
            )
            .then((resultquery) =>{
                // console.log(resultquery)
                let resultData = resultquery.data;
                let gUser = {
                    email: resultData.email,
                    firstName: resultData.given_name||' ',
                    lastName: resultData.family_name||' ',
                    fullName: resultData.name||resultData.given_name+' '+resultData.family_name,
                    googleId: resultData.id,
                    avatar: resultData.picture
                }
                return UserModel.findOne({ $or: [{ googleId : gUser.googleId }, { email: gUser.email }] } ).then(user=>{
                    if(user == null){
                        return UserModel.createUserWithGoole(gUser).then(async done => {
                            req.user = done;
                            UserController.createNewSession(req, res, done._id, { accessToken: body.accessToken, fcmToken: body.fcm_token, device: body.device } );
                        }).catch(err=>{
                            BaseController.generateMessage(res, err);
                        })
                    }
                    
                    if (user.role == UserModel.getUserRole().Banned) return BaseController.generateMessage(res, ErrorCode.UserBanned);
                    if(user.googleId != gUser.googleId) return BaseController.generateMessage(res, ErrorCode.UserBanned);
                    return UserController.createNewSession(req, res, user._id, { accessToken: body.accessToken, fcmToken: body.fcmToken, device: body.device })
                }).catch(err=>{
                    console.log(err);
                    BaseController.generateMessage(res, err);
                })
                
            })
            .catch((error) => {
                BaseController.generateMessage(res, err);
            });

        
    }

    // static async signupWithGoogle(req, res) {
    //     var body = req.body;

    //     if (!body.firstName || !body.lastName) {
    //         return BaseController.generateMessage(res, ErrorCode.InvalidUsername)
    //     }

    //     if (!body.email || body.email.indexOf('@') < 0 || body.email.indexOf('.') < 0) {
    //         return BaseController.generateMessage(res, ErrorCode.InvalidEmail)
    //     }
        

    //     UserModel.createUserWithGoole(body).then(user => {
    //         req.user = user;
    //         UserController.createNewSession(req, res, user.id, { accessToken: body.accessToken, fcmToken: body.fcm_token, device: body.device });
    //     }).catch(err => {
    //         BaseController.generateMessage(res, err);
    //     })
    // }

    // static signupWithFacebook(req, res){
    //     var body = req.body;
    //     if (!body.name ) {
    //         return BaseController.generateMessage(res, ErrorCode.InvalidUsername)
    //     }
    //     if (!body.email || body.email.indexOf('@') < 0 || body.email.indexOf('.') < 0) {
    //         return BaseController.generateMessage(res, ErrorCode.InvalidEmail)
    //     }
    //     UserModel.createUserWithFacebook(body).then(user => {
    //         req.user = user;
    //         UserController.createNewSession(req, res, user.id, { accessToken: body.accessToken, fcmToken: body.fcm_token, device: body.device });
    //     }).catch(err => {
    //         BaseController.generateMessage(res, err);
    //     })
    // }

    static async signinWithFacebook(req,res){
        var deviceInfo = {};
        var body = req.body;
        let accessToken = body.accessToken;
        var email = req.body.email;
        var facebookId = req.body.facebookId;
        email = email ? email.toLowerCase() : '';
        if (!facebookId || facebookId.length <2) return BaseController.generateMessage(res, ErrorCode.MissingParams({ message: 'access token required', field: 'accessToken' }));

        if (!accessToken) return BaseController.generateMessage(res, ErrorCode.MissingParams({ message: 'access token required', field: 'accessToken' }));
        
        // check with facebook and fill data if valid facebook
        // let requestCheckFacebook = await request('https://graph.facebook.com/v10.0/' + facebookId + '?fields=id,name,first_name,last_name&accessToken=' + accessToken);
        return UserModel.findOne({ $or: [{ facebookId : req.body.facebookId }, { email: email }, { phoneNumber: email }] }, async function (error, user) {
            if (error) return BaseController.generateMessage(res, error);
            if (user == null) {
                if(body.avatar==undefined||body.avatar==''||body.avatar.length < 1){
                    body.avatar = 'https://graph.facebook.com/' + facebookId + '/picture?redirect=true&type=square&width=150&height=150&access_token=' + Constant.facebook_app_token_for_get_avatar;
                    // body.avatar = 'http://graph.facebook.com/' + facebookId + '/picture?type=square&width=150&height=150'
                    
                }
                // axios.get( body.avatar).then(result=>{
                //     console.log('result get avatar' , result);
                // })
                return UserModel.createUserWithFacebook(body).then(async done=>{
                    return UserController.createNewSession(req, res, done._id, { accessToken: body.accessToken, fcmToken: body.fcmToken, device: body.device }  , true)        
                }).catch(err=>{
                    return BaseController.generateMessage(res, ErrorCode.UserBanned);
                })
            }
            if (user.role == UserModel.getUserRole().Banned) return BaseController.generateMessage(res, ErrorCode.UserBanned);
            if (user.facebookId != facebookId ) return BaseController.generateMessage(res, ErrorCode.UserBanned);
            return UserController.createNewSession(req, res, user._id, { accessToken: body.accessToken, fcmToken: body.fcmToken, device: body.device})
        })
    }


    static async signinWithTwitter(req, res){
        var deviceInfo = {};
        var body = req.body;
        let twitterToken = body.twitterToken;
        let twitterSecret = body.twitterSecret;
        let twitterUsername = body.username;
        var _twitterClient = new TwitterClient.TwitterClient ({
            apiKey: Constant.twitter_api_key,
            apiSecret: Constant.twitter_secret_key,
            accessToken: twitterToken,
            accessTokenSecret: twitterSecret,
        });
        _twitterClient.accountsAndUsers.accountVerifyCredentials().then(twitterData=>{
            body.fullName = twitterData.name;
            body.twitterId = twitterData.id_str;
            body.avatar = twitterData.profile_image_url_https;
            return UserModel.findOne({ $or: [{ twitterId: body.twitterId },{username:twitterUsername }, { email: twitterUsername }, ] }, function (error, user) {
                if (error) return BaseController.generateMessage(res, error);
                if (user == null){
                    return UserModel.createUserWithTwitter(body).then(async done=>{
                        return UserController.createNewSession(req, res, done._id, { accessToken: body.accessToken, fcmToken: body.fcmToken, device: body.device }  , true)        
                    }).catch(err=>{
                        return BaseController.generateMessage(res, ErrorCode.UserNotFound);
                    })
                    
                } 
                if (user.role == UserModel.getUserRole().Banned) return BaseController.generateMessage(res, ErrorCode.UserBanned);
                if (body.twitterId != user.twitterId) return BaseController.generateMessage(res, ErrorCode.UserNotFound);
                
                UserController.createNewSession(req, res, user._id, {twitterToken: body.twitterToken, twitterSecret: body.twitterSecret,  accessToken: body.accessToken, fcmToken: body.fcmToken, device: body.device })
            })
        }).catch(err=>{
            return BaseController.generateMessage(res, ErrorCode.UserNotFound);
        });
        

        // if (!twitterToken||!twitterSecret|| twitterSecret != Constant.twitter_secret_key) return BaseController.generateMessage(res, ErrorCode.MissingParams({ message: 'access token required', field: 'accessToken' }));

        // var username = req.body.username
        // username = username ? username.toLowerCase() : '';
        // if (!username) return BaseController.generateMessage(res, ErrorCode.MissingParams({ message: 'access token required', field: 'accessToken' }));


        
    }

    
    static signinWithApple(req,res){
        var body = req.body;
        var deviceInfo = {};
        var email = req.body.email;
        var appleId = req.body.appleId;
        if(!!email){
            email = email ? email.toLowerCase() : '';
        }
        
        // if (!email || !appleId) return BaseController.generateMessage(res, ErrorCode.MissingParams({ message: 'access token required', field: 'accessToken' }));
        // if (!req.body.fullName) return BaseController.generateMessage(res, ErrorCode.MissingParams({ message: 'access token required', field: 'accessToken' }));

        return UserModel.findOne({ appleId: appleId }, function (error, user) {
            if (error) return BaseController.generateMessage(res, error);
            if (user == null) {
                return UserModel.createUserWithApple(req.body).then(async done => {
                    req.user = done;
                    UserController.createNewSession(req, res, done._id, { fcmToken: req.body.fcm_token, device: req.body.device } , true);
                }).catch(err=>{
                    BaseController.generateMessage(res, ErrorCode.UserNotFound);
                })
                // return BaseController.generateMessage(res, ErrorCode.UserNotFound);
            }
            if (user.role == UserModel.getUserRole().Banned) return BaseController.generateMessage(res, ErrorCode.UserBanned);
            if (user.appleEmail != email) return BaseController.generateMessage(res, ErrorCode.UserNotFound);
            UserController.createNewSession(req, res, user._id, { accessToken: body.accessToken, fcmToken: body.fcmToken, device: body.device })
        })
    }

    static async verifyEmailAppleWithCode(request ,response){
        // var body = request.body;
        console.log('da get data de parse' );
        try{
            console.log('da get data ' + JSON.stringify(request.body));
            console.log('code ' + request.body.code);
            var resultDecode = await appleAuth.accessToken(request.body.code);
            var idToken = jwt.decode(resultDecode.id_token);
            
            BaseController.generateMessage(response , 0 , idToken);
            // fs.writeFileSync('./temp.txt', JSON.stringify(idToken));
        }catch(err){
            console.log(err);
            try{
                var idToken = jwt.decode(request.body.id_token);
                console.log('token parsed from apple ' + JSON.stringify(idToken));
                fs.writeFileSync('./temp.txt', JSON.stringify(idToken));
                
                BaseController.generateMessage(response , 0 , idToken )
            }catch(err2){
                console.log(err2)
                BaseController.generateMessage(response ,err2 )
            }
        }
        
    }

    static async signinWithAppleCallback(request, response){
        // const ANDROID_PACKAGE_IDENTIFIER = 'com.aboutyou.dart_packages.sign_in_with_apple.SignInWithAppleCallback';
        const ANDROID_PACKAGE_IDENTIFIER = 'com.global.plotagonist';
        
        

        let redirect = `intent://callback?${new URLSearchParams(
            request.body
        ).toString()}#Intent;package=${
            ANDROID_PACKAGE_IDENTIFIER
        };scheme=signinwithapple;end`;
        
        console.log(`Redirecting to ${redirect}`);
        
        response.redirect(307, redirect);
        // app.post("/callbacks/sign_in_with_apple", (request, response) => {
        //     const redirect = `intent://callback?${new URLSearchParams(
        //         request.body
        //     ).toString()}#Intent;package=${
        //         process.env.ANDROID_PACKAGE_IDENTIFIER
        //     };scheme=signinwithapple;end`;
            
        //     console.log(`Redirecting to ${redirect}`);
            
        //     response.redirect(307, redirect);
        // });
    }

    static getMyProfile(req ,res){
        BaseController.generateMessage(res, 0 , req.user.user);
    }

    static createNewSession(req, res, userId, info , isCreateNew = false) {
        LoginModel.initSessionFromEmail(userId, info, function (error, data) {
            if (data.fcmToken) {
                req.fcmToken = data.fcmToken;
            }
            if (req.session) {
                req.session.token = data.token;
            }

            if(isCreateNew){
                data.isCreateNew = isCreateNew;
            }

            req.login(data, function (err) {
                if (err) { };
                BaseController.generateMessage(res, error, data)
            })
        })
    }

    static defaultJson() {
        return { success: 0, data: { code: '000', message: 'Request invalid.' } }
    }

    static checkLogin(req, res, next) {
        const token = req.headers['authorization'] || req.cookies.token || req.body.token || req.query.token // || req.headers['authorization'] || req.session.token || req.cookies.token;
        debug('token checklogin ' + token);
        LoginModel.checkToken(token, function (error, data) {
            if (error) {
                if (error == 1) {
                    BaseController.generateMessage(res, ErrorCode.UserPermissionDeny)
                } else if (error == 2) {
                    BaseController.generateMessage(res, ErrorCode.UserBanned)
                } else {
                    BaseController.generateMessage(res, error)
                }
            } else {
                req.token = token;
                req.user = data.user
                req.login = data.login
                next();
            }
        }).catch(error => {
            BaseController.generateMessage(res, error)
        })
    }

    static checkDeviceCanRegister(req, res) {
        LoginModel.aggregate([
            { "$match": { "deviceId": req.body.deviceId } },
            {
                "$group": {
                    "_id": "$user"
                }
            }
        ]).then(listUser => {
            var count = listUser == null ? 0 : listUser.length;
            if (count == null || count < 2) {
                BaseController.generateMessage(res, null, 1);
            } else {
                BaseController.generateMessage(res, null, ErrorCode.MissingParams('Thiết bị này đã đăng ký quá nhiều'));
            }
        });
    }

    static forgotPassRequest(req, res) {
        let email = req.body.email;
        if (!email) return BaseController.generateMessage(res, ErrorCode.ForgotPwdEmailRequired);
        UserModel.findOne({ email: email }).then(async (user) => {
            if (!user) return BaseController.generateMessage(res, 'User not found');
            if(typeof user.facebookId !='undefined' || typeof user.googleId !='undefined' || typeof user.appleId !='undefined' || typeof user.twitterId !='undefined'){
                return BaseController.generateMessage(res, {message:'Cannot forgot password that registered with social account' });
            }
            let time = new Date();
            time.setDate(time.getDate() + 1);
            let token = ''+Math.floor(100000 + Math.random() * 900000)
            user.pwdForgot = token;
            await user.save();
            // var resetInfo = {
            //     username: user.fullName,
            //     resetLink: Constant.domain + `/user/reset_password/` + user.pwdForgot,
            //     email: user.email
            // }
            let mailOptions = {
                to: email,
                forgot_code: token,
            };
            return mailController
                .sendEmailResetPassword(mailOptions)
                
        }).then(send => {
            BaseController.generateMessage(res, null,  1)
        })
    }

    static confirmForgotPassword(req,res){
        var keyCode = req.parsedData.keyCode;
        var body = req.body;
        UserModel.findOne({ email: req.parsedData.email }).then(async (user) => {
            if(user.pwdForgot == keyCode){
                UserController.createNewSession(req, res, user._id, { accessToken: body.accessToken, fcmToken: body.fcmToken, device: body.device })
            }else{
                BaseController.generateMessage(res, 1)
            }
        }).catch(err => {
            BaseController.generateMessage(res, err)
        });
    }

    static changePassword(req, res) {
        UserModel.changePasswordReset(req.user.user._id, req.body.password ).then(user=>{
            BaseController.generateMessage(res, 0, 'success');
        }).catch(err=>{
            BaseController.generateMessage(res, err)
        })
    }

    static checkTokenResetPwd(req, res) {
        UserModel.checkTokenChangePwd(req.params.token).then(ok => {
            BaseController.generateMessage(res, null, {});
        }).catch(err => {
            BaseController.generateMessage(res, err);
        })
    }

    static getListUser(req, res) {
        var info = req.parsedData;
        UserModel.getUserListByCondition(info, function (err, users) {
            BaseController.generateMessage(res, err, users);
        });
    }

    static getUserById(req, res) {
        console.log(req.parsedData);
        var info = req.parsedData.info;
        UserModel.getUserInfo(info._id, function (err, user) {
            BaseController.generateMessage(res, err, user);
        });
    }

    static updateUserInfo(req, res) {
        var info = req.parsedData.userInfo;
        if (typeof info != 'undefined' && typeof info.password != 'undefined') {
            if (info.password.length > 2) {
                info.password = Utility.createPassword(info.password);
            } else {
                delete info.password
            }
        }
        UserModel.updateUserInfo(info).then(user => {
            if (user ) {
                BaseController.generateMessage(res, 0, user);
                return;
            }
            BaseController.generateMessage(res, 1);
        }).catch(err=>{
            BaseController.generateMessage(res, err);
        });
    }

    static addNewUser(req, res){
        var info = req.parsedData.userInfo;
        UserModel.createUserWithEmail(info, function(err, user){
            BaseController.generateMessage(res, err, user);
        });
    }

    static getUserRole(req, res){
        UserModel.getRoles().then(roles=>{
            BaseController.generateMessage(res, 0, roles)
        })
    }

    static checkUserExist(req, res){
        UserModel.getUserListByCondition(req.parsedData, function (err, users) {
            BaseController.generateMessage(res, err, users);
        });
    }

    

    static updateLoginData(req, res){
        var loginData = req.parsedData.loginData;
        var token  = req.user.token;
        LoginModel.updateOne({token:token}, { $set: loginData }, { new: true } ).then(result=>{
            BaseController.generateMessage(res, 0 , result)  
        }).catch(err=>{
            BaseController.generateMessage(res, err)  
        })
    }

    static sendNotificationFromAdminbackend(req, res){
        var type = req.parsedData.type;
        var userIds = req.parsedData.userIds;//[];
        var roles = req.parsedData.roles;//[];
        var contentHtml = req.parsedData.contentHtml;
        var message = req.parsedData.message;
        var title = req.parsedData.title;
        var click_action = req.parsedData.click_action;
        var topicName = req.parsedData.topicName
        if(type == NotificationUtils.NotificationType.TYPE_REG_ID){
            LoginModel.getFcmTokenFromUserIds(userIds).then(listToken=>{
                console.log('list token ' + listToken);
                
                let notificationData = NotificationUtils.generateDataMess(Constant.FCM_KEY , type , 1 , listToken , title , contentHtml , message , click_action  );
                NotificationUtils.sendNotification(notificationData);
                let listNotificationPushed = []
                for(var i= 0 ; i < userIds.length ; i++){
                    // title: String ,
                    // text: String ,
                    // value: String,
                    // message: String , 
                    // fromUser: String ,
                    // type: {type: Number , default: NotificationType.toAll},
                    // toUser: {type: Schema.Types.ObjectId, ref: 'UserModel' } ,
                    // toGroup:  {type: Number , default: 0},
                    // toTopic:  {type: Number , default: 0},
                    // toAll:  {type: Number , default: 0},
                    // listFcmToken: [String] , 
                    // isRead: {type: Number, default: 0}
                    // click_action
                    listNotificationPushed.push({
                        title:title,
                        message: message,
                        type:type,
                        contentHtml:contentHtml,
                        fromUser: req.user._id,
                        toUser: userIds[i],
                        clickAction: click_action
                    })
                }
                NotificationModel.create(listNotificationPushed).then(listPushed=>{
                    BaseController.generateMessage(res, !listPushed, listPushed.length)  ;
                }).catch(err=>{
                    BaseController.generateMessage(res, err)  ;
                });
            }).catch(err=>{
                BaseController.generateMessage(res, err)  ;
            })
        }else if(type == NotificationUtils.NotificationType.TYPE_CHANNEL){
            let notificationData = NotificationUtils.generateDataMess(Constant.FCM_KEY , type , 1 , topicName , title , contentHtml , message , click_action );
            NotificationUtils.sendNotification(notificationData);
            NotificationModel.create({
                title:title,
                message: message,
                type:type,
                contentHtml:contentHtml,
                fromUser: req.user._id,
                clickAction: click_action,
                toTopic: topicName
            }).then(listPushed=>{
                BaseController.generateMessage(res, !listPushed, listPushed)  ;
            }).catch(err=>{
                BaseController.generateMessage(res, err)  ;
            });
        }else if(type == NotificationUtils.NotificationType.TYPE_ALL ){
            let notificationData = NotificationUtils.generateDataMess(Constant.FCM_KEY , type , 1 , topicName , title , contentHtml , message , click_action );
            NotificationUtils.sendNotification(notificationData);
            NotificationModel.create({
                title:title,
                message: message,
                type:type,
                contentHtml:contentHtml,
                fromUser: req.user._id,
                clickAction: click_action,
                toTopic: topicName
            }).then(listPushed=>{
                BaseController.generateMessage(res, !listPushed, listPushed)  ;
            }).catch(err=>{
                BaseController.generateMessage(res, err)  ;
            });
        }else{
            BaseController.generateMessage(res, new Error('Not correct fomat data'))  ;
        }
        
        
    }

    static getUserNotifications(req, res){
        var data = req.parsedData;
        var topicName='';
        if(typeof data.topicName!='undefined'){
            topicName = data.topicName
        }
        data.filter = {
            $or:[
                {toUser: req.user._id},
                {type: NotificationUtils.NotificationType.TYPE_ALL},
                {type: NotificationUtils.NotificationType.TYPE_CHANNEL , topicName:topicName},
            ]

        }
        // if(typeof data.filter != 'undefined'){
        //     data.filter.fromUser = req.user._id;
        // }else{
        //     data.filter = {
        //         fromUser: req.user._id
        //     }
        // }
        NotificationModel.getNotifications(data).then(notifications=>{
            BaseController.generateMessage(res, !notifications, notifications)  ;
        }).catch(err=>{
            BaseController.generateMessage(res, new Error('Not correct fomat data'))  ;
        })
    }

    // Statistic

    static getListUserMonthly(req, res)
    {
        let year = new Date().getFullYear()
        UserModel.aggregate([ { $match:{ registerDate: { $gte: new Date(year +'-01-01'), $lte: new Date(year +'-12-31') } } },
        {$group: {
            _id:{ $month:{
                date:'$registerDate'
            }},
            total :{$sum : 1}
        }},
        {$sort:{
            _id:1
        }}
        ]).then(user=>{
            BaseController.generateMessage(res, 0, user);
        }).catch(err=>{
            BaseController.generateMessage(res, err);
        })
      
    }

    static getListActiveUserDaily(req, res)
    {
        let year = new Date().getFullYear()
        TransactionModel.aggregate([
            {
                $match: { dateCreated: { $gte: new Date(year +'-01-01'), $lte: new Date(year +'-12-31') } }
            },
            {$group: {
                _id:{ $month:{
                    date:'$dateCreated'
                }},
                total :{$sum : 1}
            }},
            {$sort:{
                _id:1
            }}
        ]).then(data=>{
            BaseController.generateMessage(res, 0, data);
        }).catch(err=>{
            BaseController.generateMessage(res, err);
        })
    }
    
    static testSendMail(){

    }
}
module.exports = UserController;