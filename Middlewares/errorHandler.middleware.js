const errorHandler=(err, req, res, next) => {
    const status = err.status || "error";
    const message = err.message || 'Internal Server Error';
    const stack = err.stack || 'Internal Server Error';
    const statusCode = err.statusCode || 500;

    return res.status(statusCode).json({
        status,
        message,
        stack: process.env.NODE_ENV === 'production' ? null : stack
    })
    ;
}

export default errorHandler;