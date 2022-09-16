const BaseController = require('./base.controller')
const Constant = require('../../constant')
const fs = require('fs-extra')

const SchoolCommunityModel = require('../../database/SchoolCommunity')
const SchoolInfoModel = require('../../database/SchoolInfo')
const UserModel = require('../../database/User')
const SubsidyRequestModel = require('../../database/SubsidyRequest')
const ApiController = require('./api.controller')

class AdminController extends ApiController {
    static index(req, res) {
        BaseController.generateMessage(res, 0, 1, 200)
    }

    static getSubsidyRequests(req,res){
        SubsidyRequestModel.getSubsidyRequests(req.parsedData).then(result=>{
            BaseController.generateMessage(res, !result, result );
        }).catch(err=>{
            BaseController.generateMessage(res,err)
        })
    }
}
module.exports = AdminController;