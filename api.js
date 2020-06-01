var mysqlConnection = require('./app');
var nodeMailer = require('nodemailer');
var Razorpay = require('Razorpay');
var instance = new Razorpay({  
  key_id: 'rzp_test_bjCQFmjjEZQU4l',
  key_secret: 'KIdcmec2tlssq06ftI25Orbw'
});
var crypto = require('crypto');

function randNumber(len) {
  return crypto
    .randomBytes(Math.ceil(len / 2))
    .toString('hex') // convert to hexadecimal format
    .slice(0, len) // return required number of characters
}



module.exports = {
  
    apiSignup: (req, res) => {
      
    if(req.body.email != "")
    {
      var randomNumber = randNumber(6);
        mysqlConnection.db.query('SELECT * FROM user WHERE userEmail = ?',[req.body.email], (err, rows, fields) => {
          if (!err)
            if(rows.length == 1) {
              var transporter = nodeMailer.createTransport({
                service: 'gmail',
                auth: {
                  user: 'tproject414@gmail.com',
                  pass: 'Satinathrana@009'
                }
              });

              var mailOptions = {
                from: 'tproject414@gmail.com',
                to: req.body.email,
                subject: 'OTP Verification',
                text: "Test",
                html: '<b>Welcome to ABC. </b> Your OTP is '+randomNumber+'.</b>'
              };
  
              transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                  console.log(error);
                } else {
                  var sql = "UPDATE user SET userOtp=?, userStatus=? WHERE userEmail=?";
                  mysqlConnection.db.query(sql,[randomNumber,0,req.body.email],(err, rows, fields) => {
                
                    if(err)
                      console.log(err);
                    else
                      res.json({status: '2',msg: 'Successfull'});
                    })
                  console.log('Email sent: ' + info.messageId + info.response);
                }
              }); 
                     
            }
            else{
              var transporter = nodeMailer.createTransport({
                service: 'gmail',
                auth: {
                  user: 'tproject414@gmail.com',
                  pass: 'Satinathrana@009'
                }
              });
              var mailOptions = {
                from: 'tproject414@gmail.com',
                to: req.body.email,
                subject: 'OTP Verification',
                text: "Test",
                html: '<b>Welcome to ABC. </b> Your OTP is '+randomNumber+'.</b>'
              };

              transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                  console.log(error);
                } else {
                  mysqlConnection.db.query("INSERT INTO user (userId,userEmail,userOtp) VALUES ('TA123','"+req.body.email+"','"+randomNumber+"')",(err, rows, fields) => {
                    if(err)
                      console.log(err);
                    else
                      res.json({status: '2',msg: 'Successfull'});
                    })
                  console.log('Email sent: ' + info.messageId + info.response);
                }
              }); 
                   
            }
          else
            console.log(err);
          })
    }
    else{
        res.json({status: '1',msg: 'Email Id Is Required'});
    }
},

apiVerifyOtp: (req, res) => {
  console.log(req.body.otp +' //'+ req.body.email);
  if(req.body.otp != "" && req.body.email != "")
  {
      mysqlConnection.db.query('SELECT * FROM user WHERE userEmail = ? AND userOtp = ? AND userStatus = ?',[req.body.email, req.body.otp, 0], (err, rows, fields) => {
          if (!err)
            if(rows.length == 0) {
              res.json({status: '2',msg: 'Not Verified'});  
            }
            else{
              var transporter = nodeMailer.createTransport({
                service: 'gmail',
                auth: {
                  user: 'tproject414@gmail.com',
                  pass: 'Satinathrana@009'
                }
              });
              var mailOptions = {
                from: 'tproject414@gmail.com',
                to: req.body.email,
                subject: 'OTP Verification',
                text: "Test",
                html: '<b>Welcome to ABC.</b>'
              };

              transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                  console.log(error);
                } else {
                  var sql = "UPDATE user SET userStatus=? WHERE userEmail=?";
                  mysqlConnection.db.query(sql,[1,req.body.email],(err, rows, fields) => {
                    if(err)
                      console.log(err);
                    else
                      res.json({status: '3',msg: 'Successfull'});
                    })
                  console.log('Email sent: ' + info.messageId + info.response);
                }
              }); 
                  
              }
          else
            console.log(err);
          })
  }
  else{
      res.json({status: '1',msg: 'OTP Is Required'});
  }
},


    apiOrderId: (req, res) => {
    const data = req.body;
    const currency = data.currency;
    const amount = Number(data.amount/100);
    
    if(data != "")
    {
      
      var options = {
        amount: amount,
        currency: currency,
        // receipt: "order_rcptid_11",
        // payment_capture: '0'
      };

      instance.orders.create(options, function(err, order) {
        if( order.id != ""){
          res.json({status: '1', result: order.id, msg: 'Your Order Id Is Successfully generated'});
        }else{
          res.json({status: '2',result: error});
        }
        
      });
 
    }
    else{
      res.json({status: '0',result: null,msg: 'Not A Valid Requeist'});
    }

  },

   apiPaymentId: (req, res) => {
    const data = req.body;
    const currency = data.currency;
    const amount = Number(data.amount*100);
    const payment_id = data.payment_id.razorpay_payment_id;

    if(payment_id != "")
     {
    //   var options = {
    //     amount: amount,
    //     currency: currency,
    //     payment_id: payment_id
    //     // receipt: "order_rcptid_11",
    //     // payment_capture: '0'
    //   };


      res.json({status: '1', result: payment_id, msg: 'Your Order Id Is Successfully generated'});
      
      // var payment_capture = instance.payments.capture(amount,currency,payment_id)
      //   if(payment_capture !=""){
      //     res.json({status: '1', result: payment_capture, msg: 'Your Order Id Is Successfully generated'});
      //   }else{
      //     res.json({status: '2',result: 'error'});
      //   }

      //  console.log(instance.payments.fetch(payment_id));
 
    }
    else{
      res.json({status: '0',result: null,msg: 'Payment Id Not Generated'});
    }

  }






}


