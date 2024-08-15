const jwt=require('jsonwebtoken')
const User=require('./../models/userModel');
const catchAsync=require('./../utils/catchAsync');
const AppError=require('./../utils/appError');

exports.signup=catchAsync(async(req,res,next)=>{
    const newUser=await User.create({
      name:req.body.name,
      email:req.body.email,
      password:req.body.password,
      confirmPassword:req.body.confirmPassword
    }); 

    const token=jwt.sign({id:newUser._id},process.env.JWT_SECRET,{
      expiresIn:process.env.JWT_EXPIRES_IN
    })

    res.status(201).json({
        status:'success',
        token,
        data:{
          user:newUser  
        }
    })
})

exports.login=catchAsync(async(req,res,next)=>{
  const {email,password}=req.body; 

  if(!email || !password){
    return next(new AppError('please provide email and password',400))
  }
  const token='';
  res.status(200).json({
    status:'success',
    token
  })
});