const BaseController = require('./base.controller')
const Constant = require('../../constant')
const fs = require('fs-extra')

const StudentServiceModel = require('../../database/StudentService');
const ParentInfoModel = require('../../database/ParentInfo');
const ProviderInfoModel = require('../../database/ProviderInfo');
const UserModel = require('../../database/User');
const StudentInfoModel = require('../../database/StudentInfo');
const AppointmentModel = require('../../database/Appointment');


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
                SkillSet: ProviderInfoModel.SkillSet
            });
        }).catch(err=>{
            BaseController.generateMessage(res, err);
        })
        
    }

    static getChildProfile(req,res){
        UserModel.getFieldValuesFromUserId(req.user.user._id, req.parsedData.fieldName||"studentInfos" ).then(ids=>{
            StudentInfoModel.getStudentInfoByIds(ids).then(students=>{
                BaseController.generateMessage(res, !students,students);
            }).catch(err=>{
                BaseController.generateMessage(res, err);
            })
        }).catch(err=>{
            BaseController.generateMessage(res, err);
        })
    }

    static searchProviders(req,res){
        ProviderInfoModel.getProviderInfos(req.parsedData).then(data=>{
            BaseController.generateMessage(res, !data,data);
        }).catch(err=>{
            BaseController.generateMessage(res, err);
        })
    }


    static createAppoinment(req,res){
        AppointmentModel.createAppointment(req.parsedData).then(data=>{
            BaseController.generateMessage(res, !data,data);
        }).catch(err=>{
            BaseController.generateMessage(res, err);
        })
    }

    static getMyAppointments(req,res){
        var searchData = req.parsedData;
        if(typeof searchData.filter == undefined){
            searchData.filter = {}
        }
        if(typeof searchData.filter.requester == undefined){
            searchData.filter.requester= req.user.user._id;
        }
        AppointmentModel.getAppointments(searchData).then(data=>{
            BaseController.generateMessage(res, !data,data);
        }).catch(err=>{
            BaseController.generateMessage(res, err);
        })
    }

    
    
}
module.exports = CustomController;