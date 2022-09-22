const BaseController = require('./base.controller')
const Constant = require('../../constant')
const fs = require('fs-extra')

const SchoolCommunityModel = require('../../database/SchoolCommunity')
const SchoolInfoModel = require('../../database/SchoolInfo')
const UserModel = require('../../database/User')
const SubsidyRequestModel = require('../../database/SubsidyRequest')
const ApiController = require('./api.controller')
const ProviderInfoModel = require('../../database/ProviderInfo')
const HierachyModel = require('../../database/Hierachy')
const StudentInfoModel = require('../../database/StudentInfo');
const AppointmentModel = require('../../database/Appointment')
class SchoolController extends ApiController {
    static index(req, res) {
        BaseController.generateMessage(res, 0, 1, 200)
    }

    static getListCommunicatesServed(req,res){
        SchoolCommunityModel.getSchoolCommunitys(req.parsedData).then(result=>{
            BaseController.generateMessage(res, 0,result)
        }).catch(err=>{
            BaseController.generateMessage(res, err)
        })
    }

    static createCommunicatesServed(req,res){
        SchoolCommunityModel.createSchoolCommunity(req.parsedData).then(result=>{
            BaseController.generateMessage(res, 0,result)
        }).catch(err=>{
            BaseController.generateMessage(res, err)
        })
    }

    static async getSchoolInfo(req,res){
        SchoolInfoModel.getSchoolInfo(req.parsedData.schoolId).then(result=>{
            BaseController.generateMessage(res, 0,result)
        }).catch(err=>{
            BaseController.generateMessage(res, err)
        })
    }

    static async getSchoolInfos(req,res){
        SchoolInfoModel.getSchoolInfos(req.parsedData).then(result=>{
            BaseController.generateMessage(res, 0,result)
        }).catch(err=>{
            BaseController.generateMessage(res, err)
        })
    }

    static async updateSchoolInfo(req, res){
        SchoolInfoModel.updateSchoolInfo(req.parsedData).then(result=>{
            BaseController.generateMessage(res, 0,result)
        }).catch(err=>{
            BaseController.generateMessage(res, err)
        })
    }


    static async getMySchoolInfo(req, res){
        
        UserModel.getFieldValuesFromUserId(req.user.user._id, req.parsedData.fieldName||"schoolInfo" ).then(id=>{
            SchoolInfoModel.getSchoolInfo(id).then(provider=>{
                BaseController.generateMessage(res, !provider,provider);
            }).catch(err=>{
                BaseController.generateMessage(res, err);
            })
        }).catch(err=>{
            BaseController.generateMessage(res, err);
        })
    }

    static getMyDependent(req,res){
        StudentInfoModel.getStudentInfoBySchoolId(req.user.user.schoolInfo).then(students=>{
            BaseController.generateMessage(res, !students,students);
        }).catch(err=>{
            BaseController.generateMessage(res, err);
        })
    }

    static getMyProviderProfile(req,res){
        // UserModel.getFieldValuesFromUserId(req.user.user._id, req.parsedData.fieldName||"studentInfos" ).then(id=>{
        //     SchoolInfoModel.getSchoolInfo(id).then(provider=>{
        //         BaseController.generateMessage(res, !provider,provider);
        //     }).catch(err=>{
        //         BaseController.generateMessage(res, err);
        //     })
        // }).catch(err=>{
        //     BaseController.generateMessage(res, err);
        // })
    }

    static getMySubsRequest(req,res){
        var searchParams = req.parsedData;
        if(searchParams.filter == undefined){
            searchParams.filter = {};
        }
        if(searchParams.filter.school == undefined){
            searchParams.filter.school = req.user.user.schoolInfo;
        }
        SubsidyRequestModel.getSubsidyRequests(searchParams).then(result=>{
            BaseController.generateMessage(res, !result,result)
        }).catch(err=>{
            BaseController.generateMessage(res, err)
        })
    }

    static getAllSubsRequestOrderByHierachy(req,res){
        SubsidyRequestModel.getAllSubsidyRequestForHierachy(req.user.user.schoolInfo).then(result=>{
            BaseController.generateMessage(res, !result,result)
        }).catch(err=>{
            BaseController.generateMessage(res, err)
        })
    }

    static sortSubsidaryByHierachy(req,res){
        SubsidyRequestModel.sortSubsidaryByHierachy(req.parsedData.orderedList).then(result=>{
            BaseController.generateMessage(res, !result,result)
        }).catch(err=>{
            BaseController.generateMessage(res, err)
        })
    }
    

    static acceptSubsRequest(req,res){
        // SubsidyRequestModel.updateSubsidyWithReturnData(req.parsedData.subsidyId , 'status' , 0 ).then(subsidy=>{
        //     BaseController.generateMessage(res, !subsidy,subsidy)
        //     ApiController.emitFromHttp(subsidy.student.toString() ,'subsidy_change_status' ,  !subsidy,subsidy);
        // }).catch(err=>{
        //     BaseController.generateMessage(res, err)
        // })
        SubsidyRequestModel.updateOne({_id:req.parsedData.subsidyId} , 
            {$set: {
            status: 1,
            providers:req.parsedData.providers,
            decisionExplanation: req.parsedData.decisionExplanation,

        }}).then(result=>{
            BaseController.generateMessage(res, !result,result)
            ApiController.emitFromHttp(req.parsedData.student ,'subsidy_change_status' ,  !result ,req.parsedData.subsidyId);
        }).catch(err=>{
            BaseController.generateMessage(res, err)
        })
    }

    static rejectSubsRequest(req,res){
        // var setData = {status: SubsidyRequestModel.SubsidyRequestStatus.DECLINE};
        // SubsidyRequestModel.updateSubsidyRequest(req.parsedData._id , {$set: setData} ).then(result=>{
        //     BaseController.generateMessage(res, !result,result)

        //     ApiController.emitFromHttp(subsidy.student.toString() ,'subsidy_change_status' ,  !subsidy,subsidy);
        // }).catch(err=>{
        //     BaseController.generateMessage(res, err)
        // })

        SubsidyRequestModel.updateSubsidyWithReturnData(req.parsedData.subsidyId , 'status' ,-1).then(subsidy=>{
            BaseController.generateMessage(res, !subsidy,subsidy)
            ApiController.emitFromHttp(subsidy.student.toString() ,'subsidy_change_status' ,  !subsidy,subsidy._id);
        }).catch(err=>{
            BaseController.generateMessage(res, err)
        })
        // SubsidyRequestModel.updateSubsidyRequest(req.parsedData._id , {$set: {status: SubsidyRequestModel.SubsidyRequestStatus.DECLINE}}).then(result=>{
        //     BaseController.generateMessage(res, !result,result)

        //     ApiController.emitFromHttp()
        // }).catch(err=>{
        //     BaseController.generateMessage(res, err)
        // })
    }

    static getAllProviderInSchool(req,res){
        ProviderInfoModel.getAllProviderInSchool(req.parsedData.schoolId).then(providers=>{
            BaseController.generateMessage(res, !providers,providers)
        }).catch(err=>{
            BaseController.generateMessage(res, err)
        })
    }

    static createHieRachy(req,res){
        req.parsedData.createdBy = req.user.user._id;
        HierachyModel.createHierachy(req.parsedData).then(result=>{
            BaseController.generateMessage(res, !result,result)
        }).catch(err=>{
            BaseController.generateMessage(res, err)
        })
    }

    static getAllHierachy(req,res){
        HierachyModel.find({schoolId: req.parsedData.schoolId}).then(result=>{
            BaseController.generateMessage(res, !result,result)
        }).catch(err=>{
            BaseController.generateMessage(res, err)
        })
    }

    static changeHierachyForSubsidy(req,res){
        SubsidyRequestModel.updateSubsidyWithReturnData(req.parsedData.subsidyId , 'hierachy' ,req.parsedData.hierachyId).then(subsidy=>{
            BaseController.generateMessage(res, !subsidy,subsidy)

        }).catch(err=>{
            BaseController.generateMessage(res, err)
        })
    }
}
module.exports = SchoolController;