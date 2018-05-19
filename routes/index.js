// export * from './appointment';

var referPatient = require('../controllers/referPatient');
var auth = require('../controllers/authenticate');
var errs = require('restify-errors');

module.exports = function(server){

    server.post('/login',(req,res,next)=>{
        const post_data = req.body;
        auth.login(post_data, (err, response)=>{
            if(err) return res.send(400, {DisplayMessage:err});
            return res.send(200,{data: response});
        });
    });

    server.use(auth.isAuthenticate);
    
}