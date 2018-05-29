
var referPatientModel = require('../models/referPatient');
function addPatient(postData, next){
    const modelDoc = { 
        name: postData.name,
        mobile:postData.mobile,
        image: postData.image,
        referDate:postData.referDate
     };
    
    //  referPatientModel.findOneAndUpdate({mobile:modelDoc.mobile},modelDoc, {
         
    //  })
    var referPatient = new referPatientModel(modelDoc);
    referPatient.save(function(err, result) {
        if (err) return next(err)
        return next(null,result);
    })


    // var referPatient = new referPatientModel(modelDoc);
    // referPatientModel.findOneAndUpdate(
    //     { mobile:post_data.mobile}, // find a document with that filter
    //     referPatient, // document to insert when nothing was found
    //     {upsert: true, new: true, runValidators: true}, // options
    //     function (err, result) { // callback
    //         if (err)   return next(err) 
    //         console.log("result2222:"+result);    
    //         return next(null,result);
    //     }
    // );

   

}
exports.addPatient = addPatient;