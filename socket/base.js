
const socketResult = 'socket_result';
module.exports = {
    socketResult :socketResult,
    _emitData(socket, key, success, info) {
        if (typeof info === 'undefined') {
          info = success;
        }
        // debug('key ' + key + ' success ' + success + ' info ' + JSON.stringify(info));
        socket.emit(socketResult, { key: key, success: success, data: info });
    },
    _broadcastDataToRoom(socket, room, key, error, info) {
      if (typeof info === 'undefined') {
        info = success;
      }
      // debug('key ' + key + ' success ' + success + ' info ' + JSON.stringify(info));
      // socket.emit(socketResult, { key: key, success: success, data: info });
      socket.to(room.toString()).emit(socketResult, { key: key, success: !error, data: error|| info });
    },
    response(socket, key) {
        var self = this;
        return function (error, info) {
          self._emitData(socket, self.getKeyEvent(key), !error, error || info);
        }
      },
      responseTo(key, room, nsp) {
        var self = this;
        return function (error, info) {
          self.ioEmitTo(room, self.getKeyEvent(key), error, info, nsp);
        }
      },
    
      responseOnChannel(key, nsp) {
        key = this.getKeyEvent(key)
        return function (error, data) {
          if (nsp) nsp.emit(socketResult, { key: key, success: !error, data: data || error });
        }
      },
    
      ioEmit(key, data, nsp) {
        if (nsp) nsp.emit(socketResult, { key: key, success: true, data: data });
        this.io.emit(socketResult, { key: key, success: true, data: data });
      },
    
      ioEmitTo(room, key, error, info, nsp) {
        // debug('key ' + key + ' success ' + JSON.stringify(error) + ' info ' + JSON.stringify(info));
        if (nsp) {
          return nsp.to(room.toString()).emit(socketResult, { key: key, success: !error, data: error || info });
        }
        this.io.to(room.toString()).emit(socketResult, { key: key, success: !error, data: error || info });
      },
    
      
    
      getDefaultObject(success, info) {
        return { success: success, data: info };
      },
      getKeyEvent(key, status) {
        if (typeof status === 'undefined') {
          return key
        }
        key = 'user_' + key
        if (status === 1) {
          return key + '_success'
        } else {
          return key + '_failed'
        }
    },
    sendNotificationToAll(message , title , type , collapseKey , callback){
      callback = callback || function () { };
      var dataStructor = {
        'to':'/topics/actnotify',
        'notification': {
          'title': title,
          'body': message,
          'sound': 'default',
          'icon': 'fcm_push_icon'
        },
        'priority': 'high',
        'collapse_key': collapseKey,
        'data': {type: type , title: title , message: message}
      };
      var options = {
        method: 'POST',
        url: 'https://fcm.googleapis.com/fcm/send',
        headers:
        {
          'content-type': ' application/json',
          'authorization': 'key=' + Constant.FCM_KEY
        },
        json: dataStructor
      }
      request(options, (err, response, body) => {
        console.log(err);
      });
    },
  
    sendNotification(registrationIds, dataMess, title, text, collapseKey, callback) {
      callback = callback || function () { };
  
      if (!registrationIds) return callback(new Error('token null'));
      if (typeof (registrationIds) == 'string') {
        registrationIds = [registrationIds];
      } else if (!Array.isArray(registrationIds)) {
        return callback(new Error('token must be string or string[]'));
      }
  
      var dataStructor = {
        'registration_ids': [],
        'notification': {
          'title': title,
          'body': text,
          'sound': 'default',
          'icon': 'fcm_push_icon'
        },
        'priority': 'high',
        'collapse_key': collapseKey,
        'data': dataMess
      };
  
      var options = {
        method: 'POST',
        url: 'https://fcm.googleapis.com/fcm/send',
        headers:
        {
          'content-type': ' application/json',
          'authorization': 'key=' + Constant.FCM_KEY
        },
        json: dataStructor
      }
      const chunk = 1000;
      debug('send notification', options.json.data);
      for (let i = 0, j = registrationIds.length; i < j; i += chunk) {
        let temparray = registrationIds.slice(i, i + chunk);
        // do whatever
        options.json.registration_ids = temparray;
        request(options, (err, response, body) => {
          debug('notification failed', err)
          if (err) return callback(err);
          callback(null, { url: body.url, status: response.statusCode, body: body });
        })
      }
    }
}   