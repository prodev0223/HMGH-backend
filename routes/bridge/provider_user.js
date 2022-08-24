const ProviderInfoModel = require('../../database/ProviderInfo');
const ProviderPrivateCalendarModel = require('../../database/ProviderPrivateCalendar');
const ProviderReduceRateModel = require('../../database/ProviderReduceRate');
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

async function validAndCreateReduceWithAcademic(info){
    return ProviderReduceRateModel.create(info).then(
        listCreated=>{
            return listCreated.map(item=>{
                return item._id;
            })
        }
    ).catch(()=> {
        return undefined;
    });
}

async function validAndCreatePrivateClass(info){
    return ProviderPrivateCalendarModel.create(info).then(
        listCreated=>{
            return listCreated.map(item=>{
                return item._id;
            })
        }
    ).catch(()=> {
        return undefined;
    });
}

async function  validAndCreateProviderInfo(info){
    var {
        contactNumber,
        contactEmail,
        manualSchedule,
        isAcceptReduceRate,
        reduceWithAcademic,
        isWillingOpenPrivate,
        privateCalendars,
    } = info;

    if(!contactNumber || !contactEmail || !manualSchedule || contactNumber.length ==0|| contactEmail.length ==0 || manualSchedule.length ==0 ){
        return undefined;
    }

    if(isAcceptReduceRate==1){
        if(!reduceWithAcademic || reduceWithAcademic.length ==0){
            return undefined;
        }
        var newReduce = await validAndCreateReduceWithAcademic(reduceWithAcademic);
        if(!newReduce){
            return undefined;
        }
        info.reduceWithAcademic = newReduce;
    }else{
        info.reduceWithAcademic = [];
    }

    if(isWillingOpenPrivate == 1){
        if(!privateCalendars || privateCalendars.length == 0){
            return undefined;
        }

        var newCalendar = await validAndCreatePrivateClass(privateCalendars);
        if(!newCalendar ){
            return undefined;
        }
        info.privateCalendars = newCalendar;

    }else{
        info.privateCalendars = [];
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

// module.exports.validAndCreateSchoolInfo = validAndCreateSchoolInfo;
module.exports.validAndCreateProviderInfo = validAndCreateProviderInfo;