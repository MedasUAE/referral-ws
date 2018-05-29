
var referPatient = require('../controllers/referPatient');
var auth = require('../controllers/authenticate');
var registerUser = require('../controllers/registerUser');
var errs = require('restify-errors');

module.exports = function (server) {

    server.post('/login', (req, res, next) => {
        auth.login(req.body, (err, response) => {
            if (err) return res.send(400, { DisplayMessage: err });
            res.setHeader('token', response.token);
            return res.send(200, { data: response });
        });
    });

    //server.use(auth.isAuthenticate);

    server.post({ path: '/addreferpatient', version: '1.0.0' }, (req, res, next) => {
        referPatient.addPatient(req.body, (err, result) => {
            if (err) return res.send(400, { error: err });
            return next(null, result);
        });
    });

    server.post({ path: '/register', version: '1.0.0' }, (req, res, next) => {
        registerUser.addUser(req.body, (err, result) => {
            if (err) return res.send(400, { error: err });
            return next(null, result);
        });
    });

    server.get("/verifyotp", (req, res) => {
        registerUser.verifyOtp(req.query.mobile, req.query.otp, (err, result) => {
            if (err) return res.send(400, { error: err });
            return res.json({ data: result });
        });
    });




}