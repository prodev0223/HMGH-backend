const BaseController = require('./base.controller')
const Constant = require('../../constant')
const fs = require('fs-extra')

const SchoolCommunityModel = require('../../database/SchoolCommunity')

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

    static async validAndCreateSchoolInfo(info){
        
    }
}
module.exports = SchoolController;