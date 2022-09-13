const BaseController = require('./base.controller')
const Constant = require('../../constant')
const fs = require('fs-extra')

const SchoolCommunityModel = require('../../database/SchoolCommunity')
const SchoolInfoModel = require('../../database/SchoolInfo')
const UserModel = require('../../database/User')
const SubsidyRequestModel = require('../../database/SubsidyRequest')

class SchoolController extends BaseController {
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

    static async getSchoolInfo(req, res){
        SchoolInfoModel.getSchoolInfo(req.parsedData).then(result=>{
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

    static acceptSubsRequest(req,res){

    }

    static rejectSubsRequest(req,res){
        
    }
}
module.exports = SchoolController;