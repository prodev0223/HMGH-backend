
var UserModel = require('../database/User')
var SchoolCommunityModel = require('../database/SchoolCommunity')
var Utility = require('../utility');
async function initDefaultValues(){
    initUser();

    initSchoolCommunities();
}

function initUser(){
    var userRole = UserModel.getUserRole();
    UserModel.countDocuments ({ 'email': 'admin@admin.com' }).then(number => {
        if (!number) {
        return UserModel.create({ fullName: 'admin', email: 'admin@admin.com', password: Utility.createPassword('admin'), role: userRole.Super_Admin });
        }
        return Promise.resolve();
    }).then(user => {
        
    }).catch(e => {
    });
}

function initSchoolCommunities(){
    SchoolCommunityModel.countDocuments ({ 'name': 'Chicago' }).then(number => {
        if (!number) {
        return SchoolCommunityModel.create({ 'name': 'Chicago' });
        }
        return Promise.resolve();
    }).catch(e => {
    });
}

function handleTickTimeout(){
    
}

module.exports = async () => {
    await initDefaultValues();
    handleTickTimeout();
    require('../utils/log.utils')('app finished boosting\n');
};