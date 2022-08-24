const BaseController = require('./base.controller')
const Constant = require('../../constant')
const fs = require('fs-extra')

const StudentServiceModel = require('../../database/StudentService');
const ParentInfoModel = require('../../database/ParentInfo');
const ProviderInfoModel = require('../../database/ProviderInfo');

class CustomController extends BaseController {
    static index(req, res) {
        BaseController.generateMessage(res, 0, 1, 200);
    }  

    static getDefaultValueForClient(req, res) {
        StudentServiceModel.find().then(listServices=>{
            BaseController.generateMessage(res, 0,{
                listServices:listServices,
                MaritialType: ParentInfoModel.MaritialType,
                AcademicLevel: ProviderInfoModel.AcademicLevel,
                
            });
        }).catch(err=>{
            BaseController.generateMessage(res, err);
        })
        
    }

    
}
module.exports = CustomController;