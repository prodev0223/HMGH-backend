const SchoolCommunityModel = require('../../database/SchoolCommunity')
const SchoolInfoModel = require('../../database/SchoolInfo')
const SchoolSessionModel = require('../../database/SchoolSession')
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

async function  validAndCreateSchoolInfo(info){
    var name = info.name;
    var communityServed = info.communityServed;
    var sessionsInSchool = await validAndCreateSchoolSessions(info.sessionsInSchool);
    var sessionsAfterSchool = await validAndCreateSchoolSessions(info.sessionsAfterSchool);
    var valueForContact = info.valueForContact;
    var techContactRef = info.techContactRef;
    var studentContactRef = info.studentContactRef;
    if(!name || !communityServed|| !sessionsInSchool||sessionsInSchool.length==0 || !sessionsAfterSchool || sessionsAfterSchool.length==0 || !valueForContact || !techContactRef||techContactRef.length==0 ||!studentContactRef || studentContactRef.length ==0 ){
        return undefined;
    }
    if(!ObjectId.isValid(communityServed)){
        return undefined;
    }
    return SchoolInfoModel.create({
        name: name,
        communityServed: communityServed,
        sessionsInSchool:sessionsInSchool,
        sessionsAfterSchool:sessionsAfterSchool,
        valueForContact:valueForContact,
        techContactRef:techContactRef,
        studentContactRef: studentContactRef,
    }).then(schoolInfo=>{
        return schoolInfo._id;
    }).catch((err)=>{
        return undefined;
    });
}

module.exports.validAndCreateSchoolInfo = validAndCreateSchoolInfo;
module.exports.validAndCreateSchoolSessions = validAndCreateSchoolSessions;