const BaseController = require('./base.controller')
const Constant = require('../../constant')
const fs = require('fs-extra')

const SchoolCommunityModel = require('../../database/SchoolCommunity')
const SchoolInfoModel = require('../../database/SchoolInfo')
const UserModel = require('../../database/User')
const SubsidyRequestModel = require('../../database/SubsidyRequest')
const HierachyModel =require('../../database/Hierachy')
const ApiController = require('./api.controller')
const StudentInfoModel = require('../../database/StudentInfo')

class AdminController extends ApiController {
    static index(req, res) {
        BaseController.generateMessage(res, 0, 1, 200)
    }

    static async getSubsidyRequests(req,res){

        var searchData = req.parsedData;
        if(searchData.filter == undefined){
            searchData.filter = {};
        }
        if(!!searchData.filterSchool){
            var arrIds = await SchoolInfoModel.find({name:{ '$regex': searchData.filterSchool, '$options': 'i' }} ).distinct('_id').catch(err=>{ return []});
            searchData.filter.school = {$in: arrIds};
        }

        if(!!searchData.filterStudent){
            var arrIds = await StudentInfoModel.find({
                $or:[
                   { firstName:{ '$regex': searchData.filterStudent, '$options': 'i' }},
                    {lastName:{ '$regex': searchData.filterStudent, '$options': 'i' }}
                ]
                
            } ).distinct('_id').catch(err=>{ return []});
            searchData.filter.student = {$in: arrIds};
        }

        if(!!searchData.filterProvider){
            var arrIds = await SchoolInfoModel.find({
                $or:[
                   { name:{ '$regex': searchData.filterProvider, '$options': 'i' }},
                    {referredToAs:{ '$regex': searchData.filterProvider, '$options': 'i' }}
                ]
                
            }).distinct('_id').catch(err=>{ return []});
            searchData.filter.selectedProvider = {$in: arrIds};
        }

        // if(!!searchData.filterStatus){
            
        //     searchData.filter.status = {
        //         $or:[
        //             { status: searchData.filterStatus},
        //             {adminApprovalStatus:searchData.filterStatus}
        //         ]
                
        //     };
        // }

        SubsidyRequestModel.getSubsidyRequests(searchData).then(result=>{
            BaseController.generateMessage(res, !result, result );
        }).catch(err=>{
            BaseController.generateMessage(res,err)
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
            adminApprovalStatus: 1,
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

        SubsidyRequestModel.updateSubsidyWithReturnData(req.parsedData.subsidyId , 'adminApprovalStatus' ,-1).then(subsidy=>{
            BaseController.generateMessage(res, !subsidy,subsidy)
            ApiController.emitFromHttp(subsidy.student.toString() ,'subsidy_change_status' ,  !subsidy,subsidy._id);
            ApiController.emitFromHttp(subsidy.school.toString() ,'subsidy_change_status' ,  !subsidy ,subsidy._id);
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

    static selectProviderForSubsidy(req,res){
        
        SubsidyRequestModel.updateOne({_id:req.parsedData.subsidyId} , 
            {$set: {
                selectedProvider: req.parsedData.selectedProvider,
                numberOfSessions:req.parsedData.numberOfSessions,
                priceForSession: req.parsedData.priceForSession,
                adminApprovalStatus:1

        }}).then(result=>{
            BaseController.generateMessage(res, !result,result)
            ApiController.emitFromHttp(req.parsedData.student ,'subsidy_change_status' ,  !result ,req.parsedData.subsidyId);
            ApiController.emitFromHttp(req.parsedData.school ,'subsidy_change_status' ,  !result ,req.parsedData.subsidyId);
        }).catch(err=>{
            BaseController.generateMessage(res, err)
        })
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
module.exports = AdminController;