const notFound = (req, res, next) => {
    return res.status(404).json({
        Msg: "not found this route"
    });
}
module.exports = notFound