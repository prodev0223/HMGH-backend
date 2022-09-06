const BaseController = require('./base.controller')
const Constant = require('../../constant')
const fs = require('fs-extra')

const ProviderInfoModel = require('../../database/ProviderInfo')
const CityConnectionModel = require('../../database/CityConnection')
const UserModel = require('../../database/User')
const AppointmentModel = require('../../database/Appointment')


class ProviderController extends BaseController {
    static index(req, res) {
        BaseController.generateMessage(res, 0, 1, 200)
    }

    static getDefaultValuesForProvider(req,res){
        BaseController.generateMessage(res, 0, {
            ContactNumberType:ProviderInfoModel.ContactNumberType,
            EmailType:ProviderInfoModel.EmailType,
            SkillSet: ProviderInfoModel.SkillSet,
            SreenTime: ProviderInfoModel.SreenTime,
            AcademicLevel: ProviderInfoModel.AcademicLevel,
            SreenTime: ProviderInfoModel.SreenTime,
            CancellationWindow: ProviderInfoModel.CancellationWindow,
        });
    }

    static getCityConnection(req,res){
        CityConnectionModel.getCityConnections(req.parsedData).then(result=>{
            BaseController.generateMessage(res, 0,result)
        }).catch(err=>{
            BaseController.generateMessage(res, err)
        })
    }

    static getMyProviderInfo(req,res){
        UserModel.getFieldValuesFromUserId(req.user.user._id, req.parsedData.fieldName||"providerInfo" ).then(id=>{
            ProviderInfoModel.getProviderInfo(id).then(provider=>{
                BaseController.generateMessage(res, !provider,provider);
            }).catch(err=>{
                BaseController.generateMessage(res, err);
            })
        }).catch(err=>{
            BaseController.generateMessage(res, err);
        })
    }

    static updateMyProviderProfile(req,res){
        BaseController.generateMessage(res, 0,200);
    }

    static getListAppoinmentRequestedMe(req,res){
        var searchData = req.parsedData;
        if(typeof searchData.filter == undefined){
            searchData.filter = {}
        }
        if(typeof searchData.filter.provider == undefined){
            searchData.filter.provider= req.user.user._id;
        }
        AppointmentModel.getAppointments(searchData).then(data=>{
            BaseController.generateMessage(res, !data,data);
        }).catch(err=>{
            BaseController.generateMessage(res, err);
        })
    }
}
module.exports = ProviderController;