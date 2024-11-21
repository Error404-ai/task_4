const express = require('express');
const Userrouter = express.Router();

//mongodb user model
const User = require('../models/user');

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
                        dateofBirth
                    });

                    newUser.save().then(result => {
                        res.json({
                            status: "SUCCESS",
                            message: "SIGNUP SUCCESSFULL",
                            data: result,
                        })
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

//Signin
Userrouter.post('/signin',(req,res) =>
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