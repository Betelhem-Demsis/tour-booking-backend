class AppError extends Error{
    constructor(message,statuscode){
        super(message);
        this.statusCode=statusCode;
        this.status=`${statusCode}`.startswith('4') ? 'fail':'error';
        this.isOperational=true;
    }
}


module.exports=AppError