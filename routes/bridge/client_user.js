const ParentInfoModel = require('../../database/ParentInfo');
const ProviderInfoModel = require('../../database/ProviderInfo')
const SchoolSessionModel  = require('../../database/SchoolSession');
const StudentInfoModel = require('../../database/StudentInfo');
const SubsidyRequestModel = require('../../database/SubsidyRequest');
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

async function validAndCreateSubsidy(info){
    return SubsidyRequestModel.createSubsidyRequest(info).then(sub=>{
        return sub._id;
    }).catch(err=>{
        return undefined;
    })
}

async function validAndCreateParentInfo(parentInfo){
    return ParentInfoModel.create(parentInfo).then(parent=>{
            return parent._id;
        }
    ).catch(()=> {
        return undefined;
    });
}

async function validAndCreateStudentInfos(clientInfos){
    if(!clientInfos||clientInfos.length == 0){
        return undefined;
    }
    var listClients = [];
    for(var i = 0 ; i < clientInfos.length;i++){
        var info = clientInfos[i];
        if(!info.availabilitySchedule||info.availabilitySchedule.length == 0){
            return undefined;
        }
        if(!!info.subsidyRequest){
            var newSubsidyRequest = await validAndCreateSubsidy(info.subsidyRequest);
            if(!newSubsidyRequest){
                return undefined;
            }
            info.subsidyRequest = newSubsidyRequest;
        }
        var newAvailabilitySchedule = await validAndCreateSchoolSessions(info.availabilitySchedule);
        if(!newAvailabilitySchedule || newAvailabilitySchedule.length == 0){
            return undefined;
        }

        info.availabilitySchedule = newAvailabilitySchedule;
        var newStudent = await StudentInfoModel.createStudentInfo(info).then(student=>{return student._id}).catch(err=>{return undefined;})
        if(!newStudent) return undefined;
        listClients.push(newStudent);
    }
    if(listClients.length > 0){
        return listClients;
    }
    return undefined;
}

async function validAndCreate1StudentInfo(info){
    
    if(!info.availabilitySchedule||info.availabilitySchedule.length == 0){
        return undefined;
    }
    if(!!info.subsidyRequest){
        var newSubsidyRequest = await validAndCreateSubsidy(info.subsidyRequest);
        if(!newSubsidyRequest){
            return undefined;
        }
        info.subsidyRequest = newSubsidyRequest;
    }
    var newAvailabilitySchedule = await validAndCreateSchoolSessions(info.availabilitySchedule);
    if(!newAvailabilitySchedule || newAvailabilitySchedule.length == 0){
        return undefined;
    }

    info.availabilitySchedule = newAvailabilitySchedule;
    return StudentInfoModel.createStudentInfo(info).then(student=>{return student._id}).catch(err=>{return undefined;})
    
}

async function  validAndCreateClientInfo(info){
    var {
        parentInfo,
        studentInfos,
    } = info;
    if(!parentInfo || !studentInfos || studentInfos.length == 0){
        return undefined;
    }
    var pairedParentInfo = await validAndCreateParentInfo(parentInfo);
    if(!pairedParentInfo){
        return undefined;
    }
    var pairedStudentInfo = await validAndCreateStudentInfos(studentInfos);
    if(!pairedStudentInfo|| pairedStudentInfo.length == 0){
        return undefined;
    }

    return {parentInfo: pairedParentInfo ,studentInfos: pairedStudentInfo}

}
module.exports.validAndCreate1StudentInfo = validAndCreate1StudentInfo;
module.exports.validAndCreateClientInfo = validAndCreateClientInfo;