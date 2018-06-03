
var referPatient = require('../controllers/referPatient');
var auth = require('../controllers/authenticate');
var user = require('../controllers/user');
var errs = require('restify-errors');

module.exports = function (server) {
    server.post({ path: '/register', version: '1.0.0' }, (req, res) => {
        user.addUser(req.body, (err, result) => {
            if (err) return res.send(400, { error: err });
            return res.send(200, { data: result });
        });
    });

    server.get("/verifyotp", (req, res) => {
        user.verifyOtp(req.query.mobile, req.query.otp, (err, result) => {
            if (err) return res.send(400, { error: err });
            return res.json({ data: result });
        });
    });

    server.post('/login', (req, res) => {
        auth.login(req.body, (err, response) => {
            if (err) return res.send(400, { DisplayMessage: err });
            return res.send(200, { data: response });
        });
    });

    server.use(auth.isAuthenticate);

    server.post({ path: '/addreferpatient', version: '1.0.0' }, (req, res) => {
        referPatient.addPatient(req.body, (err, result) => {
            if (err) return res.send(400, { error: err });
            return res.send(200, { data: result });
        });
    });


}