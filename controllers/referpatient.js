
var referPatientModel = require('../models/referPatient');
function addPatient(postData, next) {
    var currentDate = new Date(Date.now()).toLocaleString();
    const modelDoc = {
        name: postData.name,
        mobile: postData.mobile,
        image: postData.image,
        referDate: currentDate
    };
    var referPatient = new referPatientModel(modelDoc);
    referPatient.save(function (err, result) {
        console.log("result:"+result);
        if (err) return next(err)
        return next(null, result);
    })

}
exports.addPatient = addPatient;