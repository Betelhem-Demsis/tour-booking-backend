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

exports.getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find();

  res.status(200).json({
    status: "success",
    results: users.length,
    data: { users },
  });
});

const filterBody=filterObj(req.body,'name','email');
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



exports.getUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not yet defined",
  });
};
exports.createUser = factory.createOne(User);
exports.updateUser =factory.updateOne(User)
exports.deleteUser = factory.deleteOne(User)
