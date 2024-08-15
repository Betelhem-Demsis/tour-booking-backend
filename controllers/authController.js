
const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');

// function to sign the JWT token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken=(user,statusCode,res)=>{
  const token=signToken(user._id)
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
}

// Signup controller
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword
  });
  createSendToken(newUser,201,res);
});

// Login controller
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1. Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  // 2. Check if user exists and password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3. If everything is ok, send token to client
  createSendToken(user,200,res);
});

// Protect middleware
exports.protect = catchAsync(async (req, res, next) => {
  let token;

  // 1. Get the token and check if it exists
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in! Please log in to get access.', 401));
  }

  // 2. Validate the token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3. Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }

  // 4. Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('User recently changed password! Please log in again.', 401));
  }

  req.user = currentUser;
  next();
});

// authorize user

exports.restrictTo=(...roles)=>{
  return(req,res,next)=>{
    if(!roles.includes(req.user.role)){
      return next(new AppError('You do not have permission to perform this action',403))
    }
    next()
  }
}

exports.forgotPassword=catchAsync(async(req,res,next)=>{
  const user=await User.findOne({email:req.body.email})
  if(!user){
    return next(new AppError('there is no user with this email address',404))
  }

  const resetToken=user.createPasswordResetToken()
  await user.save({validateBeforeSave:false});
  
  const resetURL=`${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`
  
  const message='forgot password? Submit a PATCH request with your new password and confirmPassword to: ${resetURL}.\nIf you did not forget your password, please ignore this email!'
 try{
  await sendEmail({
    email:user.email,
    subject:'your password reset token (valid for 10 min)',
    message
  })

  res.status(200).json({
  status:'success',
  message:'token sent to email'
  })
 }
 catch(err){
  user.PasswordResetToken=undefined;
  user.PasswordResetExpires=undefined;
  await user.save({validateBeforeSave:false});
  return next(new AppError('there was an error sending the email. Try again later!',500))
 }
 
})
exports.resetPassword=catchAsync(async (req,res,next)=>{
 const hashedToken=crypto.createHash('sha256').update(req.params.token).digest('hex')

 const user=await User.findOne({passwordResetToken: hashedToken, passwordResetExpires:{$gt:Date.now()}
 });

 if(!user){
  return next(new AppError('token is invalid',400))
 }
 user.password=req.body.password;
 user.confirmPassword=req.body.confirmPassword;
 user.passwordResetToken=undefined;
 user.passwordResetExpires=undefined;
 await user.save();
 createSendToken(user,200,res);
})

exports.updatePassword=catchAsync(async(req,res,next)=>{
  const user=await User.findById(req.user.id).select('+password')

  if(!(await user.correctPassword(req.body.passwordCurrent,user.password))){
    return next(new AppError('your current password is wrong',401))
  }

  user.password=req.body.password
  user.confirmPassword=req.body.confirmPassword
  await user.save()
  createSendToken(user,200,res);
})