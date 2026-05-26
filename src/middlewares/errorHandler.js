const errorHandler = (err, req, res, next) => {
    return res.status(500).json({
        msg: err.message,
        err: "err"
    })
}
module.exports = errorHandler