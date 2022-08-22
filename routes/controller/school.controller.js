const BaseController = require('./base.controller')
const Constant = require('../../constant')
const fs = require('fs-extra')

const SchoolCommunityModel = require('../../database/SchoolCommunity')
const SchoolInfoModel = require('../../database/SchoolInfo')

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
}
module.exports = SchoolController;