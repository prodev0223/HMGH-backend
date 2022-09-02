const rootFolder = __dirname

const dbConfig = require('./config/database.json');
const envConfig = require('./config/environment.json');
const mailConfig = require('./config/email.json');

let Constant = {
  secretKey: envConfig.secretKey,
  rootFolder: rootFolder,
  dbConfig:dbConfig,

  domain: envConfig.domain,
  port: envConfig.port,
  SecrectKey:'afsd@J#j0f8udsafnj12(9%',

  uploadFolderName: envConfig.uploadsFolderName,
  uploadFolder: rootFolder + '/public/' + envConfig.uploadsFolderName,
  baseUrl: envConfig.domain + ':' + envConfig.port + '/',
  frontendUrl:'http://localhost:3000',

  //  MAILSERVER
  mailConfig: mailConfig,

  // OSTYPE:
  aos: 1, // android: 1
  ios: 2, // iphone: 2
  wos: 3, // webbrowser: 3
  // GENDERTYPE:
  male: 1,
  female: 2,

  models:[],

  // google client
  
  GOOGLE_CLIENT_ID:'985253988516-p51392n53campkkljt23gnqe9d6hbuk2.apps.googleusercontent.com',
  GOOGLE_CLIENT_SERECT:'F3nqGdegFHxwWVKGQhpT9_D-',

  // facebook 
  facebook_api_key: '253862506409561',
  facebook_api_secret: '71c1819b5e8ea2ed24d3b8dc84f66e2d',
  facebook_app_token_for_get_avatar:'253862506409561|omzBh0t-0PmzJO5W904cCcuD_rw',

  twitter_api_key:'crFUPcZGJ09DuujwVpVrHztg2',
  twitter_secret_key: 'c6FLatI0z8XUC3UtIyLWQEMOoYWJHEQahP0PFjd1sEh8OIejhf',

  // FCMCONSTANT
  FCM_KEY: 'AAAA5WW2yKQ:APA91bFz8vmjdYMjBSlkVci38G850Y6fqBpXVNF9vBOUsIqUSR1VjndUo1vtd89kUTKFxsaUbY_luFG5En8KFQLn1IIY8YohoizgflQ04vjC6C8mKwI_Fm8b7vXUg3UIndQbX3H4o73s',
  
}
module.exports = Constant
