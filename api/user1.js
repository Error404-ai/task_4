const express = require('express');
const Userrouter = express.Router();

//mongodb user model
const User = require('./../models/user');

//mongodb userverification model
const UserVerification = require('./../models/UserVerification');

//email handler
const nodemailer = require('nodemailer');

//unique string
const {v4 : uuidv4} = require("uuid");

//env variables
require('dotenv').config();

//nodemailer transporter //this is not working
let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASS,
    },
    logger: true,
    debug: true,
});


//testing success
transporter.verify((error,success) =>
{
    if(error){
        console.log(error);
    }
    else{
        console.log("Ready for messages");
        console.log(success);
    }
});


//Password Handler
const bcrypt = require('bcrypt');

//signup
Userrouter.post('/signup', (req, res) => {
    let { name, email, password, dateofBirth } = req.body;
    name = name.trim();
    email = email.trim();
    password = password.trim();
    dateofBirth = dateofBirth.trim();
    console.log("Recieved name :",name);
    if (name == "" || email == "" || password == "" || dateofBirth == "") {
        res.json({
            status: "FAILED",
            message: "Empty input fields!"
        });
    }
    else if (!/^[a-zA-Z\s]*$/.test(name)) {
        res.json({
            status: "FAILED",
            message: "Invalid name entered"
        })
    } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
        res.json({
            status: "FAILED",
            message: "Invalid email entered"
        })
    } else if (!new Date(dateofBirth).getTime()) {
        res.json({
            status: "FAILED",
            message: "Invalid date of birth entered"
        })
    } else if (password.length < 8) {
        res.json({
            status: "FAILED",
            message: "Password is too short!"
        })
    } else {
        // Checking if user already exists
        User.find({ email }).then(result => {
            if (result.length) {
                res.json(
                    {
                        status: "FAILED",
                        message: "User with the provided email already exists"
                    })
            } else {
                //Try to create new user

                //password handling
                const saltRounds = 10;
                bcrypt.hash(password, saltRounds).then(hashedPassword => {
                    const newUser = new User({
                        name,
                        email,
                        password: hashedPassword,
                        dateofBirth,
                        verified : false
                    });

                    newUser.save().then(result => {
                       //handle account verification
                       console.log("User saved successfully:", result);
                       sendVerificationEmail(result,res);
                    }
                    )
                        .catch(err => {
                            res.json({
                                status: "FAILED",
                                message: "An error Occured while saving user account!"
                            })

                        })
                })
                    .catch(err => {
                        console.log(err);
                        res.json({
                       status: "FAILED",
                            message: "An error Occured while hashing password!"
                        })
                    })

            }
        }).catch(err => {
            console.log(err);
            res.json({
                status: "FAILED",
                message: "An error Occured while checking for existing user!"
            })
        }
        )
    }
})

//send verification email
const sendVerificationEmail = ({_id,email},res) =>
{
    //url to be used in the email
    const currentUrl = "http://localhost:5001/";
    const uniqueString = uuidv4() + _id;
    const mailOptions ={
        from: process.env.AUTH_EMAIL,
        to: email,
        subject: "Verify Your Email",
        html :
       ` <p>Verify your email address to complete the signup and login into your account.</p>
        <p>This link <b>expires in 1 hour</b>.</p>
        <p>Press <a href="${currentUrl}user/verify/${_id}/${uniqueString}">here</a> to proceed.</p>`
    };

    //hash the uniqueString
    const saltRounds= 10;
    bcrypt.hash(uniqueString, saltRounds).then((hashedUniqueString) =>{
        const newVerification = new UserVerification({
            userId: _id,
            uniqueString: hashedUniqueString,
            createdAt: Date.now(),
            expiresAt: Date.now() + 3600000, // 1 hour
        });

        newVerification.save()
            .then(() => {
                console.log("verification email sent successfully")
                transporter.sendMail(mailOptions)
                    .then(() => {
                        res.json({
                            status: "PENDING",
                            message: "Verification email sent!",
                        });
                    })
                    .catch((error) => {
                        console.log("Error while sending")
                        res.json({
                            status: "FAILED",
                            message: "Failed to send verification email!",
                        });
                    });
            })
            .catch((error) => {
                console.log("Error while saving");
                res.json({
                    status: "FAILED",
                    message: "An error occurred while saving the verification record!",
                });
            });
    })
        .catch((error) =>
    {   console.log("Error while hashing");
        res.json({
            status: "FAILED",
            message : "Error occured while hashing email data!",
        });
    }
    )

}

//verify email
Userrouter.get('/verify/:userId/:uniqueString', (req, res) => {
    const { userId, uniqueString } = req.params;

    UserVerification.findOne({ userId })
        .then((record) => {
            if (!record) {
                res.json({ status: 'FAILED', message: 'Verification link expired or invalid.' });
            } else {
                bcrypt.compare(uniqueString, record.uniqueString).then((isMatch) => {
                    if (isMatch) {
                        User.updateOne({ _id: userId }, { verified: true })
                            .then(() => {
                                UserVerification.deleteOne({ userId })
                                    .then(() => res.redirect('/login'))
                                    .catch((err) => res.json({ status: 'FAILED', message: 'Error updating user.' }));
                            })
                            .catch((err) => res.json({ status: 'FAILED', message: 'Error updating user.' }));
                    } else {
                        res.json({ status: 'FAILED', message: 'Invalid verification link.' });
                    }
                });
            }
        })
        .catch((err) => res.json({ status: 'FAILED', message: 'Error verifying user.' }));
});


//Signin
Userrouter.post('/login',(req,res) =>
{
    let{email, password,} = req.body;
    email = email.trim();
    password = password.trim();

    if(email == "" || password == ""){
        res.json({
    status : "FAILED",
    message : "Empty credentials supplied"
})}
else{
    //check if user exists
    User.find({email})
    .then(data => 
    {
        if(data.length) {
            //user exists
            const hashedPassword = data[0].password;
            bcrypt.compare(password,hashedPassword).then(result => {
             if(result){
                res.json({
                    status : "SUCCESS",
                    message : "SIGNIN SUCCESSFULL",
                    data : data
                })
            } else  {
                res.json({
                        status: "FAILED",
                        message : "INVALID PASSWORD ENTERED!"
                })
            }
        }) .catch(err =>
        {
            res.json({
                status : "FAILED",
                message : "An error occured while comparing passwords"
            })
        })
        } else {
            res.json({
                status : "FAILED",
                message : "Invalid credentials entered!"
            })
        }
    })
    .catch(err =>
    {
        res.json({
            status : "FAILED",
            message : "An error occured while checking for existing user"
        })
    } )
}
})

module.exports = Userrouter;