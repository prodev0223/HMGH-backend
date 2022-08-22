const BaseController = require('./base.controller')
const Constant = require('../../constant')
const fs = require('fs-extra')

const ProviderInfoModel = require('../../database/ProviderInfo')
const CityConnectionModel = require('../../database/CityConnection')

class ProviderController extends BaseController {
    static index(req, res) {
        BaseController.generateMessage(res, 0, 1, 200)
    }

    static getDefaultValuesForProvider(req,res){
        BaseController.generateMessage(res, 0, {
            ContactNumberType:ProviderInfoModel.ContactNumberType,
            EmailType:ProviderInfoModel.EmailType,
            SkillSet: ProviderInfoModel.SkillSet,
            
        });
    }

    static getCityConnection(req,res){
        CityConnectionModel.getCityConnections(req.parsedData).then(result=>{
            BaseController.generateMessage(res, 0,result)
        }).catch(err=>{
            BaseController.generateMessage(res, err)
        })
    }
}
module.exports = ProviderController;