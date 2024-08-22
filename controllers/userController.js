const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError=require('./../utils/appError')
const factory = require("./handleFactory");

const filterObj = (obj, ...allowedFields) => {
  const newObj={}
  Object.keys(obj).forEach(el=>{
    if(allowedFields.includes(el)) newObj[el]=obj[el]
  })
  return newObj

}
exports.getMe=(req,res,next)=>{
  req.params.id=req.user.id;
  next()
}

// const filterBody=filterObj(req.body,'name','email');
exports.updateMe=catchAsync(async(req,res,next)=>{
  if(req.body.password||req.body.confirmPassword){
    return next(new AppError('this route is not for password updates. Please use /updateMyPassword',400))
  }
  const updateUser=await User.findByIdAndUpdate(req.user.id,x,{
    new:true,
    runValidators:true
  })
  
 res.status(200).json({
   status:'success',
   data:{
    user:updateUser 
   }
 })
})

exports.deleteMe=catchAsync(async(req,res,next)=>{
  await User.findByIdAndUpdate(req.user.id,{active:false})

  res.status(204).json({
    status:'success',
    data:null
  })
})

exports.createUser =(req,res)=>{
  res.status(500).json({
    status:'error',
    message:'This route is not defined! please use /signup instead'
  })
} ;

exports.getUser = factory.getOne(User);
exports.getAllUsers = factory.getAll(User)
exports.updateUser =factory.updateOne(User)
exports.deleteUser = factory.deleteOne(User)
