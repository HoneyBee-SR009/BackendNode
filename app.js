
const mysql = require('mysql');
const express = require('express');
const bodyParser = require('body-parser');
var session = require('express-session');
var connectFlash = require("connect-flash");
var path    = require("path");
var multer = require('multer');
var nodeMailer = require('nodemailer');// use for send mail
const { check, validationResult } = require('express-validator');
const { matchedData, sanitizeBody } = require('express-validator');
var md5 = require('md5');

const {apiSignup, apiOrderId, apiPaymentId, apiVerifyOtp} = require('./api');







// Set The Storage Engine
const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: function(req, file, cb){
    cb(null,Date.now() + '-' + file.originalname);
  }
});
//path.extname(file.originalname)
// Init Upload
const upload = multer({
  storage: storage,
  limits:{fileSize: 1000000},
  fileFilter: function(req, file, cb){
    checkFileType(file, cb);
  }
}).single('myImage');

// Check File Type
function checkFileType(file, cb){
  // Allowed ext
  const filetypes = /jpeg|jpg|png|gif/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);

  if(mimetype && extname){
    return cb(null,true);
  } else {
    cb('This Type Of File Not Allowed');
  }
}

var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
	secret: 'secret',
	resave: false,
	saveUninitialized: false
}));
app.use(connectFlash());
app.use((req, res, next) => {
  res.locals.flashMessages = req.flash();
  next();
});
app.set('view engine', 'ejs'); 
app.use(express.static('./public'));


//cross origin policy
// Add headers
app.use(function (req, res, next) {

  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);

  // Pass to next layer of middleware
  next();
});

//end cors



// var mysqlConnection = mysql.createConnection({
//   host: 'localhost',
//   user: 'root',
//   password: '',
//   database: 'users',
//   multipleStatements: true
//   });

var mysqlConnection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'tatkataaza',
  multipleStatements: true
  });
 


  app.get('/fetchData' ,(req, res) => {
    if(session.setUserId) {
    var userId= session.userId;
    mysqlConnection.query('SELECT * FROM users WHERE id = ?',[userId], (err, rows, fields) => {
    if (!err)
      res.render('profile.ejs', { rows: rows });
    else
      console.log(err);
    })
  }else{
    res.redirect('/');
  }
  });


  app.get('/',(req, res)=>{
    if(!session.setUserId) {
    res.render('index.ejs');
    }
    else{
      res.redirect('/fetchData');
    }
  });

  app.get('/registrationView', (req, res)=>{
    res.render('registration.ejs');
  });

  app.get('/imageUploadView/:id', (req, res)=>{
    if(session.setUserId) {
      res.render('upload');
    }else{
      res.redirect('/');
    }
  });

  app.get('/updateView/:id', (req, res)=>{
    if(session.setUserId) {
      //console.log('hii');
    mysqlConnection.query('SELECT * FROM users WHERE id = ?',[session.userId], (err, rows, fields) => {
      if (!err)
        res.render('update.ejs', { rows: rows });
      else
        console.log(err);
      })
    }else{
      //console.log('hello');
      res.redirect('/');
    }
  });
  


  app.post('/login',  [
    check('email','Email Must Be Field').isEmail().trim().escape(),
    check('password','Password Must Be At Least 5 Character Long').isLength({ min: 5 }).trim().escape()
  ], (req, res) => { 
    // req.session.save();
    // var session = req.session;
    if(!session.setUserId) {
    const errors = validationResult(req);
    if(req.body.email!="" && req.body.password!=""){
      if (!errors.isEmpty()) {
        // const user = matchedData(req);
        var errMsgs = errors.array().map(err => err.msg);
        req.flash('errormessage', errMsgs);
        res.redirect('/');
        
      // res.render('index',{title:'User Details',error:errors.mapped()});
      
      }
      else{
        mysqlConnection.query('SELECT * FROM users WHERE email = ? AND password = ? AND status = ?',[req.body.email, md5(req.body.password),1
        ], (err, rows, fields) => {
              if (!err)
              if (rows.length ==1) {
                session = req.session;
                session.userId = rows[0].id;
                session.setUserId = true;
                //console.log(req.session.userId);
                res.redirect('/fetchData');
                
              }else{
                  req.flash('errormessage', 'Wrong User Input');
                  res.redirect('/');
              }
              else
                console.log(err);
              })
      }
  }
  else{
    req.flash('errormessage', 'All Fields Are Required');
    res.redirect('/');
  }
}
else{
  res.redirect('/');  
}
});


function loggedIn(req, res,next){
  if(session.userId) {
        return true;
      }  
      else  
      {  
        return false; 
      } 

};

  app.get('/logout', (req, res)=>{
    if(session.setUserId==true) {
      req.session.destroy(function(err){  
        if(err){  
            console.log(err);  
        }  
        else  
        { 
            session.setUserId = false;
            res.redirect('/');  
        } 
    });
  }else{

    // console.log("There has no ID");
    res.redirect('/');  
  }
    
  });
  
  

  app.post('/registration',  [
    check('email','Please Enter A Valid Email Id').isEmail().trim().escape(),
    // check('username','Username Must Be At Least 5 Character Long').isLength({ min: 5 }).trim().escape(),
    check('name','Please Enter Your Name').notEmpty().trim().escape(),
    check('password','Password Must Be At Least 5 Character Long').isLength({ min: 5 }).trim().escape()
  ], (req, res) => { 

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // const user = matchedData(req);
      var errMsgs = errors.array().map(err => err.msg);
      req.flash('errormessage', errMsgs);
      res.redirect('/registrationView');
      
    // res.render('index',{title:'User Details',error:errors.mapped()});
    
    }else{
      mysqlConnection.query('SELECT * FROM users WHERE email = ?',[req.body.email], (err, rows, fields) => {
        if (!err)
        if (rows.length ==1) {
          req.flash('errormessage', 'Email Id Already Exist');
          res.redirect('/registrationView');
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
                  subject: 'Welcome Mail',
                  text: "Test",
                  html: '<b>Welcome Mr./Mrs. '+req.body.name+' .Your Password is '+req.body.password+'</b>'
                };


                transporter.sendMail(mailOptions, function(error, info){
                  if (error) {
                    console.log(error);
                  } else {

                      var sql =  "INSERT INTO users (id,name, email, password) VALUES ('','"+req.body.name+"', '"+req.body.email+"','"+md5(req.body.password)+"')";
                        mysqlConnection.query(sql,(err, rows, fields) => {
                          if(err)
                          console.log(err);
                          // if(rows){
                          //   req.flash('errormessage', 'Now You Can Sign In');
                          //   res.redirect('/');
                          // }
                          // else{
                          //   req.flash('errormessage', 'Something Went Wrong');
                          //   res.redirect('/registrationView');
                          // }
                          })
                    console.log('Email sent: ' + info.messageId + info.response);
                    req.flash('errormessage', 'Now You Can Sign In');
                    res.redirect('/');
                  }
                }); 
            }
        else
          console.log(err);
        })
    }
  });

  app.post('/update',  [
    check('email','Please Enter A Valid Email Id').isEmail().trim().escape(),
    // check('username','Username Must Be At Least 5 Character Long').isLength({ min: 5 }).trim().escape(),
    check('name','Please Enter Your Name').notEmpty().trim().escape()
  ], (req, res) => { 
    if(session.setUserId) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      //console.log('hello');
      // const user = matchedData(req);
      var errMsgs = errors.array().map(err => err.msg);
      req.flash('errormessage', errMsgs);
      res.redirect('/updateView/:session.userId');
    
    }else{
        var name = req.body.name;             
        var email = req.body.email;
        var sql = "UPDATE users SET name=?, email=? WHERE id=?";
          mysqlConnection.query(sql,[name,email,session.userId],(err, rows, fields) => {
            if (!err)
            if (rows) {
                req.flash('errormessage', 'You Have Successfully Updated Your Profile');
                res.redirect('/fetchData');
            }else{
            
                req.flash('errormessage', 'Wrong User Input');
                res.redirect('/updateView/:session.userId');
            }
            else
              console.log(err);
            })
     
    }
  }else{
    res.redirect('/');
  }
  });
  

  app.get('/delete/:id', (req, res) => { 
    if(session.setUserId) {
        var sql = "UPDATE users SET status=? WHERE id=?";
          mysqlConnection.query(sql,[0,session.userId],(err, rows, fields) => {
            if (!err)
            if (rows) {
                req.flash('errormessage', 'You Have Deactivated Your Profile');
                res.redirect('/');
            }else{
              //console.log(hiiii);
                req.flash('errormessage', 'Something Went Wrong');
                res.redirect('/fetchData');
            }
            else
              console.log(err);
            })
     
    
  }else{
    res.redirect('/');
  }
  });


  app.post('/upload', (req, res) => {
    if(session.setUserId) {
    upload(req, res, (errors) => {
      if(errors){
       
         req.flash('errormessage', errors);
         res.redirect('/imageUploadView/:session.userId');
        
      } else {
        if(req.file == undefined){
          var errMsgs = "No File Selected";
          req.flash('errormessage', errMsgs);
          res.redirect('/imageUploadView/:session.userId');
        } else {
          var sql = "UPDATE users SET profileimage=? WHERE id=?";
          mysqlConnection.query(sql,[req.file.filename,session.userId],(err, rows, fields) => {
            if (!err)
            if (rows) {
                res.redirect('/fetchData');
            }else{
                req.flash('errormessage', 'Wrong User Input');
                res.redirect('/imageUploadView/:session.userId');
            }
            else
              console.log(err);
            })
          // res.render('index', {
          //   msg: 'File Uploaded!',
          //   file: `uploads/${req.file.filename}`
          // });
        }
      }
    });
  }else{
    res.redirect('/');
  }
  });







//api start

app.post('/signup', apiSignup);
app.post('/orderId', apiOrderId);
app.post('/PaymentId', apiPaymentId);
app.post('/verifyOtp', apiVerifyOtp);

//api end

  app.listen(8080,() => console.log(`Listening on port 8080 ..`));


     // mysqlConnection.connect((err)=> {
  //   if(!err)
  //   console.log('Connection Established Successfully');
  //   else
  //   console.log('Connection Failed!'+ JSON.stringify(err,undefined,2));
  //   });

  module.exports.db = mysqlConnection;