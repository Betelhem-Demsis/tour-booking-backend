const AppError=require('./../utils/appError')

const handleCastErrorDB=err=>{
  const message=`invalid ${err.path}: ${err.value}`
  return new AppError(message,400)
}
const handleDuplicateFieldsDB=err=>{
  
  const value=err.errmsg.match(/(["'])(\\?.)*?\1/);
  const message=`Duplicate field value: ${err.keyValue.name}. Please use another value`
  return new AppError(message,400)
}
const handleValidationErrorDB=err=>{
  const error=Object.values(err.errors).map(el=>el.message)
  const message = `Invalid input data. ${error.join('. ')}`;
  return new AppError(message,400)
}

const handleJWTError=()=>new AppError('invalid token,please login again ',401)
const handleJWTExpiredError=()=>new AppError('your token has expired,please login again',401)

const sendErrorDev=(err,req,res)=>{
  res.status(err.statusCode).json({
    status:err.status,
    error:err,
    message:err.message,
    stack:err.stack
  })
}
const sendErrorprod = (err, req, res) => {
  if (err.isOperational) {
      res.status(err.statusCode).json({
          status: err.status,
          message: err.message,
      });
  } else {
      console.error('ERROR', err);
      res.status(500).json({
          status: 'error',
          message: 'Something went wrong!',
      });
  }
};


module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
      sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
      let error = Object.assign({}, err);
      error.message = err.message; 
      if (error.name === 'CastError') error = handleCastErrorDB(error);
      if (error.code === 11000) error = handleDuplicateFieldsDB(error);
      if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
      if (error.name === 'JsonWebTokenError') error = handleJWTError();
      if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

      sendErrorprod(error, req, res);
  }
};
