const BaseController = require('./base.controller')
const Constant = require('../../constant')
const fs = require('fs-extra')

const ProviderInfoModel = require('../../database/ProviderInfo')
const CityConnectionModel = require('../../database/CityConnection')
const UserModel = require('../../database/User')
const AppointmentModel = require('../../database/Appointment')
const ApiController = require('./api.controller')


class ProviderController extends ApiController {
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
        ProviderInfoModel.updateProviderInfo(req.parsedData).then(student=>{
            BaseController.generateMessage(res, !student,student);
        }).catch(err=>{
            BaseController.generateMessage(res, err);
        })
        BaseController.generateMessage(res, 0,200);
    }

    static createAppoinment(req,res){
        var postData = req.parsedData;
        postData.requester = req.user.user._id;
        AppointmentModel.createAppointment(req.parsedData).then(data=>{
            BaseController.generateMessage(res, !data,data);
            socketController.emitFromHttp( postData.provider , 'new_appoint_from_client', 0 , data  );
        }).catch(err=>{
            BaseController.generateMessage(res, err);
        })
    }

    static getListAppoinmentRequestedMe(req,res){
        var searchData = req.parsedData;
        if(searchData.filter == undefined){
            searchData.filter = {}
        }
        if(searchData.filter.provider == undefined){
            searchData.filter.provider= req.user.user.providerInfo;
        }
        searchData.sort = {date:1};
        AppointmentModel.getAppointments(searchData).then(data=>{
            BaseController.generateMessage(res, !data,data);
        }).catch(err=>{
            BaseController.generateMessage(res, err);
        })
    }

    static getMyAppointmentsInMonth(req, res){
        AppointmentModel.aggregate([
            {$addFields: {  "month" : {$month: '$date'},
            "year" : {$year: '$date'}
            }},
            {$match: { 
                month: req.parsedData.month,
                year: req.parsedData.year,
                provider: req.user.user.providerInfo,
                status:{$in:[0,1]}
            }}
            ]).then(result=>{
                if(!!result && result.length>0){
                    var populate = [{path:'requester', select: UserModel .PublicFields} , {path: 'dependent' } , {path:'provider'}]
                    AppointmentModel.populate(result, populate).then(result2=>{
                        BaseController.generateMessage(res, !result2,result2);
                    }).catch(er=>{
                        BaseController.generateMessage(res, err);
                    })
                }else{
                    BaseController.generateMessage(res, !result,result);
                }
                
                
            }).catch(err=>{
                BaseController.generateMessage(res, err);
            })
    }


}
module.exports = ProviderController;