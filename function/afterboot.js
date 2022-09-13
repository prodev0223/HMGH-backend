
var UserModel = require('../database/User')
var SchoolCommunityModel = require('../database/SchoolCommunity')
var SchoolInfoModel = require('../database/SchoolInfo')
var CityConnectionModel = require('../database/CityConnection')
var StudentServiceModel = require('../database/StudentService')

const SchoolUserBridge = require('../routes/bridge/school_user');

var Utility = require('../utility');
async function initDefaultValues(){
    initUser();

    initSchoolCommunities();
    initSchoolInfo();
    initCityConnection();
    initClientServices();
}

function initUser(){
    var userRole = UserModel.getUserRole();
    UserModel.countDocuments ({ 'email': 'admin@admin.com' }).then(number => {
        if (!number) {
        return UserModel.create({ isActive:1,fullName: 'admin', email: 'admin@admin.com', password: Utility.createPassword('admin'), role: userRole.Super_Admin });
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

function initCityConnection(){
    CityConnectionModel.countDocuments ({ 'name': 'Chicago' }).then(number => {
        if (!number) {
        return CityConnectionModel.create({ 'name': 'Chicago' });
        }
        return Promise.resolve();
    }).catch(e => {
    });
}

function initClientServices(){
    var arr = ['Early Childhood',
    'General Studies',
    'Homework Assitance',
    'Kirah Specialist',
    'Limudei Kodesh',
    'Math',
    'OT',
    'OT- Carry over',
    'Play Therapy',
    'Reading Specialist',
    'Social Worker',
    'Speed Therapy',];
    StudentServiceModel.countDocuments ({ 'name': arr[0] }).then(number => {
        if (!number) {
            var newArr = arr.map(item=>{
                return {name: item};
            });
            return StudentServiceModel.create(newArr);
        }
        return Promise.resolve();
    }).catch(e => {
    });
    
}

function initSchoolInfo(){
    SchoolInfoModel.countDocuments ({ 'name': 'Arie Crown' }).then(async number => {
        if (!number) {
            
            
            var arrName = ["Arie Crown",
                "Yeshivas Tiferes Tzvi",
                "Joan Dachs Bais Yaakov",
                "Nursery",
                "Playgroup",
                ]
            for(var i = 0 ; i <arrName.length ; i++){
                var tempInfo = {
                    "role":60,
                    "communityServed":"6302788ceeebce6fb875cbcb",
                    "valueForContact":"123 abc def",
                    "sessionsInSchool":[
                        {
                            "dayInWeek":1,
                            "openHour":7,
                            "openMin":0,
                            "closeHour":18,
                            "closeMin":0
                        },
                        {
                            "dayInWeek":2,
                            "openHour":7,
                            "openMin":0,
                            "closeHour":18,
                            "closeMin":0
                        },
                        {
                            "dayInWeek":3,
                            "openHour":7,
                            "openMin":0,
                            "closeHour":18,
                            "closeMin":0
                        },
                        {
                            "dayInWeek":4,
                            "openHour":7,
                            "openMin":0,
                            "closeHour":18,
                            "closeMin":0
                        }
                    ],
                    "sessionsAfterSchool":[
                        {
                            "dayInWeek":0,
                            "openHour":7,
                            "openMin":0,
                            "closeHour":18,
                            "closeMin":0
                        }
                    ],
                    "techContactRef":["1234","123456"],
                    "studentContactRef":["12399","12355"]
                };
                tempInfo.name = arrName[i];
                
                await SchoolUserBridge.validAndCreateSchoolInfo(tempInfo);
            }
            // return SchoolCommunityModel.create(arrSchoolInfo);
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