var Mongoose =  require( 'mongoose');
var UserModel = require('../database/User');
var LoginModel = require('../database/Login');

var Constant = require('../constant')
var request = require('request')
var Promise = require('bluebird')
var fs = require('fs-extra');
var moment = require('moment')
fs = Promise.promisifyAll(fs);
var debug = require('debug')(Constant.debug_name + ':socket');
const ApiList = require('./socketapi')

var parseCookie = require('./parsecookie');

var socketResult = 'socket_result';
var __ = require('i18n').__;

var UserRoles = UserModel.getUserRole();
const ejs = require('ejs')
const path = require('path');

debug('init socket');

const BaseSocketController = require('./base');

class ChatController {
  constructor() {
    var self = this;
    this.users = {};
    this.fcmTokens = {};
    this.socketsOfUser = {};
    this.io = require('socket.io')();
    // this.io = require('socket.io')({
    //   cors: {
    //     origin: "http://localhost:3000"
    //   }
    // });
    this.nspApi = this.io.of('api');
    // this.nspAdmin = this.io.of('admin');
    // this.nspFrontend = this.io.of('frontend');
    function respUnauthenticate(error, next) {
      let err = new Error(__('c'));
      err.data = { type: 'authentication_error', detail: error };
      debug('check login fail', JSON.stringify(err));
      return next(err);
    }

    LoginModel.aggregate([
      {
        $group: {
          _id: '$user',
          items: { $addToSet: '$fcmToken' }
        }
      }
    ]).then((logins) => {
      logins.forEach((login) => {
        this.fcmTokens[login._id.toString()] = login.items;
      })
      // debug('fcmTokens',this.fcmTokens);
    }).then(() => {
      debug('init namespace root');
      this.nspApi.use(async function (socket, next) {
        let token = socket.handshake.query.token || parseCookie.get('ddp_token', socket.request.headers.cookie) ||socket.handshake.headers.token ;
        console.log('get token', token);
        if (!token) return respUnauthenticate('Token required', next);
        try {
          let user = await self.checkLogin(socket, token);
          let userId = user._id.toString();
          socket.user = user;
          socket.join(userId);

          if (!self.socketsOfUser[userId] || self.socketsOfUser[userId].length == 0) {
            self.socketsOfUser[userId] = [socket.id];
          } else {
            if (self.socketsOfUser[userId].indexOf(socket.id) == -1) {
              self.socketsOfUser[userId].push(socket.id);
            }
          }

          next();
          // debug('nspApi', self.users[userId])
        } catch (e) {
          respUnauthenticate(e, next);
        }
      })
    //   this.nspFrontend.use(function (socket, next) {
    //     socket.join('frontend');
    //     next();
    //   })
    //   this.nspAdmin.use(async function (socket, next) {
    //     let token = socket.handshake.query.token || parseCookie.get('ddp_token', socket.request.headers.cookie);

    //     let error = 'token missing';
        
    //     try {
    //       if (token) {
    //         await self.checkRole(socket, { token: token }, UserRoles.Admin);
    //         return next();
    //       }
    //     } catch (e) {
    //       error = e;
    //     }
    //     respUnauthenticate(error, next);
    //   });

      debug('add socket handler');
      this.addSocketHandler();
      this.addEventHandler();
      debug('init socket finish');
      this.emit('init-finish')
    }).catch(e => {
      debug('init socket error ' + JSON.stringify(e));
    }).bind(this);

    // this.on('init-finish', () => {
    //   // schedule to notify
    // })
  }


  

  addSocketHandler() {
    if (typeof this.io === 'undefined') {
      debug('io undefined');
      return;
    }
    var that = this;
    this.io.on('connection',  function(socket){
      console.log('socket connection');
    });
    this.nspApi.on('connection',  function(socket){
      console.log('socket connection at api namespaces');
      socket.on(ApiList.get_user_by_id, function (info) {
        UserModel.getUserInfo(info._id, that.response(this, ApiList.get_user_by_id));
      });

      socket.on(ApiList.join_room, function (roomId) {
        socket.join(roomId);
      });

    });
    
  }


  addEventHandler() {
    debug('socket connection');

    
  }

  

  checkLogin(socket, token, callback) {
    debug('check login ' + token)
    // var self = this;
    return new Promise(async (resolve, reject) => {
      try {
        let login = await LoginModel.checkToken(token);
        resolve(login.user);
      } catch (error) {
        if (error) {
          if (error == -1) {
            BaseSocketController._emitData(socket, 'login_error', 0, __('UserPermissionDeny'));
            return reject(__('UserPermissionDeny'));
          } else if (error == 1) {
            BaseSocketController._emitData(socket, 'login_error', 0, __('UserPermissionDeny'));
            return reject(__('UserPermissionDeny'));
          } else if (error == 2) {
            BaseSocketController._emitData(socket, 'login_error', 0, __('UserBanned'));
            return reject(__('UserBanned'));
          } else {
            BaseSocketController._emitData(socket, 'login_error', 0, error.toString());
            return reject(error.toString());
          }
        }

        BaseSocketController._emitData(socket, 'login_error', 0, __('ErrorUnknown'));
        reject(new Error('Unknown error'));
      }
    }).asCallback(callback);
  }
  
  response(socket, key) {
    let self = this;
    return function (error, info) {
      self._emitData(socket, self.getKeyEvent(key), !error, error || info);
    };
  }
  responseTo(key, room, nsp) {
    let self = this;
    return function (error, info) {
      self.ioEmitTo(room, self.getKeyEvent(key), error, info, nsp);
    };
  }

  responseOnChannel(key, nsp) {
    key = this.getKeyEvent(key);
    return function (error, data) {
      if (nsp) nsp.emit(socketResult, { key: key, success: !error, data: data || error });
    };
  }

  
  
  ioEmitTo(room, key, error, info, nsp) {
    // debug('key ' + key + ' success ' + JSON.stringify(error) + ' info ' + JSON.stringify(info));
    if (nsp) {
      return nsp.to(room.toString()).emit(socketResult, { key: key, success: !error, data: error || info });
    }
    this.io.to(room.toString()).emit(socketResult, { key: key, success: !error, data: error || info });
  }

  emitFromHttp(room, key, error, info){
    this.nspApi.to(room.toString()).emit(socketResult, { key: key, success: !error, data: error || info });
  }

  getKeyEvent(key, status) {
    if (typeof status === 'undefined') {
      return key;
    }
    key = 'user_' + key;
    if (status === 1) {
      return key + '_success';
    } else {
      return key + '_failed';
    }
  }
  
}


const instance = new ChatController();
Object.freeze(instance);
module.exports = instance;
// module.exports.socket_result = socketResult;
