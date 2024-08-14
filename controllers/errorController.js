const sendErrorDev=(err,req,res)=>{
  res.status(err.statusCode).json({
    status:err.status,
    error:err,
    message:err.message,
    stack:err.stack
  })
}
const sendErrorprod=(err,req,res)=>{
  if(err.isOperational){
    res.status(err.statusCode).json({
      status:err.status,
      message:err.message,  
    })
  } else{
    console.error('Error',err);
    res.status(500).json({
      status:'error',
      message:'something went wrong'
    })
  }
}

export default((err,req,res,next)=> {
    err.statusCode=err.statusCode || 500;
    err.status=err.status||'error';

    if(process.env.NODE_ENV==='development'){
      sendErrorDev(err,res)
      }
    else if(process.env.NODE_ENV==='production'){
      let error={...err}
      if(error.name==='CastError') error= handleCastErrorDB(error)

        
        sendErrorprod(err,res)   
    }
    res.status(err.statusCode).json({
      status:err.status,
      message:err.message
    })
    });
  