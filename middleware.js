const jwt = require('jsonwebtoken')
module.exports = function (req, res, next) {
    try {
        let token = req.header('x-token');
        if (!token) {
            return res.status(501).send("unauthorized client access")
        }
        let decode = jwt.verify(token, "jwtSecret")
        let payload = {
            user: {
                id: ExpressValidator.id,
            },
            req.user = decode.user
        }
    } catch (err) {

    }
}