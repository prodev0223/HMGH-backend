const ProviderInfoModel = require('../../database/ProviderInfo')
const SchoolSessionModel  = require('../../database/SchoolSession')
var ObjectId = require('mongoose').Types.ObjectId;

async function validAndCreateSchoolSessions(info){
    return SchoolSessionModel.create(info).then(
        listCreated=>{
            return listCreated.map(session=>{
                return session._id;
            })
        }
    ).catch(()=> {
        return undefined;
    });
}

async function  validAndCreateClientInfo(info){
    var {
        contactNumber,
        contactEmail,
        manualSchedule,
    } = info;

    if(!contactNumber || !contactEmail || !manualSchedule || contactNumber.length ==0|| contactEmail.length ==0 || manualSchedule.length ==0 ){
        return undefined;
    }

    var newSchoolSession = await validAndCreateSchoolSessions(manualSchedule);
    if(!newSchoolSession||newSchoolSession.length == 0){
        return undefined;
    }
    info.manualSchedule = newSchoolSession;
    return ProviderInfoModel.create(info).then(provider=>{
        return provider;
    }).catch(err=>{
        return undefined;
    })
}

module.exports.validAndCreateClientInfo = validAndCreateClientInfo;