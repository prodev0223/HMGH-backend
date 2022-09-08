const BaseController = require('./base.controller')
const Constant = require('../../constant')
const fs = require('fs-extra')

const StudentServiceModel = require('../../database/StudentService');
const ParentInfoModel = require('../../database/ParentInfo');
const ProviderInfoModel = require('../../database/ProviderInfo');
const UserModel = require('../../database/User');
const StudentInfoModel = require('../../database/StudentInfo');
const AppointmentModel = require('../../database/Appointment');
const { validAndCreate1StudentInfo } = require('../bridge/client_user');
const SchoolSessionModel = require('../../database/SchoolSession');

const socketController = require('../../socket/controller');

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

    static getParentProfile(req,res){
        UserModel.getFieldValuesFromUserId(req.user.user._id, req.parsedData.fieldName||"parentInfo" ).then(id=>{
            ParentInfoModel.getParentInfo(id).then(parentInfo=>{
                BaseController.generateMessage(res, !parentInfo,parentInfo);
            }).catch(err=>{
                BaseController.generateMessage(res, err);
            })
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

    static updateChildProfile(req,res){
        StudentInfoModel.updateStudentInfo(req.parsedData).then(student=>{
            BaseController.generateMessage(res, !student,student);
        }).catch(err=>{
            BaseController.generateMessage(res, err);
        })
    }

    static async updateSchedule(req,res){
        var result = [];
        
        var listAvailabilitySchedule = req.parsedData.availabilitySchedule;
        var studentInfo = await StudentInfoModel.getStudentInfo(req.parsedData.studentInfoId);
        for(var i = 0 ; i < listAvailabilitySchedule.length ; i++){
            if(listAvailabilitySchedule[i]._id != undefined){
                // exist on db
                var resultUpdate = await SchoolSessionModel.updateOne(listAvailabilitySchedule[i]._id , listAvailabilitySchedule[i]).catch(err=>{return undefined});
                if(resultCreate!=undefined){
                    result.push(resultUpdate);
                }else{
                    result.push(('error on update item' + i+ ' '+ JSON.stringify(listAvailabilitySchedule[i])));
                }
                
            }else{
                var resultCreate = await SchoolSessionModel.create(listAvailabilitySchedule[i]).then(sche=>{return sche._id;}).catch(err=>{return undefined;});
                if(resultCreate!=undefined){
                    result.push(resultCreate);
                    studentInfo.availabilitySchedule.push(resultCreate)
                }else{
                    result.push(('error on add item' + i + ' ' + JSON.stringify(listAvailabilitySchedule[i])));
                }   
                
            }
        }
    }

    static removeScheduleItem(req,res){
        StudentInfoModel.removeAvailabilitySchedule(req.parsedData.studentId , req.parsedData.availabilityScheduleItem ).then(student=>{
            BaseController.generateMessage(res, !student,student);
        }).catch(err=>{
            BaseController.generateMessage(res, err);
        })
    }

    static async addChild(req,res){
        var newChild = validAndCreate1StudentInfo(req.parsedData);
        if(newChild==undefined){
            BaseController.generateMessage(res, 'cannot add child');
        }else{
            req.user.user.studentInfos.push(newChild);
            req.user.user.save();
            BaseController.generateMessage(res, 0,newChild);
        }
    }

    static searchProviders(req,res){
        ProviderInfoModel.getProviderInfos(req.parsedData).then(data=>{
            BaseController.generateMessage(res, !data,data);
        }).catch(err=>{
            BaseController.generateMessage(res, err);
        })
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


    static updateSubsidyForStudent(req, res){

    }
    
    
}
module.exports = CustomController;