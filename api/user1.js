const express = require('express');
const Userrouter = express.Router();

//mongodb user model
const User = require('./../models/user');

//mongodb userverification model
const UserVerification = require('./../models/UserVerification');

//mongodb userverification model
const PasswordReset = require('./../models/PasswordReset');

//email handler
const nodemailer = require('nodemailer');

//unique string
const {v4 : uuidv4} = require("uuid");

//env variables
require('dotenv').config();

//nodemailer transporter //this is not working
let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASS
    }
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
// const UserOTPVerification = require('../models/UserOTPVerification');

//signup
Userrouter.post('/signup', (req, res) => {
    let { name, email, password} = req.body;
    if((name && typeof name === 'string') && (email && typeof email === 'string') && (password && typeof password === 'string'))
   { name = name.trim();
    email = email.trim();
    password = password.trim();
   }
    console.log("Recieved name :",name);
    if (name == "" || email == "" || password == "") {
        return res.status(404).json({
            status: "FAILED",
            message: "Empty input fields!"
        });
    }
    else if (!/^[a-zA-Z\s]*$/.test(name)) {
        return res.status(404).json({
            status: "FAILED",
            message: "Invalid name entered"
        })
    } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
        return res.status(404).json({
            status: "FAILED",
            message: "Invalid email entered"
        })}

     else if (password.length < 8) {
        return res.status(404).json({
            status: "FAILED",
            message: "Password is too short!"
        })
    } else {
        // Checking if user already exists
        User.findOne({ email }).then(result => {
            if (result) {
                return res.status(404).json(
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
                        verified : false
                    });
                    module.exports = newUser;
                    newUser.save().then(result => {
                       //handle account verification
                    //    console.log("hello",result._id);
                       sendVerificationEmail(result,res);
                    //    sendOTPVerificationEmail(result,res);
                       
                    }
                    )
                        .catch(err => {
                            return res.status(500).json({
                                status: "FAILED",
                                message: "An error Occured while saving user account!"
                            })

                        })
                })
                    .catch(err => {
                        console.log(err);
                        return res.status(500).json({
                       status: "FAILED",
                            message: "An error Occured while hashing password!"
                        })
                    })

            }
        }).catch(err => {
            console.log(err);
            return res.status(500).json({
                status: "FAILED",
                message: "An error Occured while checking for existing user!"
            });
        });
    }
});

//send verification email
const sendVerificationEmail = ({_id,email},res) =>
{
    //url to be used in the email
    const currentUrl = "https://task-4-0pfy.onrender.com/";
    // console.log("idesss",_id);
    const uniqueString = uuidv4() + _id;
    const mailOptions ={
        from: process.env.AUTH_EMAIL,
        to: email,
        subject: "Verify Your Email",
        html :
       ` <p>Verify your email address to complete the signup and login into your account.</p>
        <p>This link <b>expires in 1 hour</b>.</p>
        <p>Press <a href="${currentUrl}user/verify/${uniqueString}">here</a> to proceed.</p>`
    };

    //hash the uniqueString
    const saltRounds= 10;
    bcrypt.hash(uniqueString, saltRounds).then((hashedUniqueString) =>{
        console.log("hashedUniqueString",hashedUniqueString);
        const newVerification = new UserVerification({
            userId: _id,
            uniqueString: hashedUniqueString,
            createdAt: Date.now(),
            expiresAt: new Date(Date.now() + 3600000) // 1 hour
        });
        module.exports = newVerification;

        newVerification.save()
            .then( () => {
                console.log("verification email sent successfully")
                transporter.sendMail(mailOptions)
                    .then(() => {
                        res.json({
                            status: "PENDING",
                            message: "Verification email sent!",
                            data : {
                                userId : _id,
                                email,
                            },
                        });
                    })
                    .catch((error) => {
                        console.log("Error while sending")
                        return res.status(500).json({
                            status: "FAILED",
                            message: "Failed to send verification email!",
                        });
                    });
            })
            .catch((error) => {
                console.log("Error while saving");
                return res.status(500).json({
                    status: "FAILED",
                    message: "An error occurred while saving the verification record!",
                });
            });
    })
        .catch((error) =>
    {   console.log("Error while hashing");
        return res.status(500).json({
            status: "FAILED",
            message : "Error occured while hashing email data!",
        });
    }
    )
   
}



//verify email
Userrouter.get('/verify/:uniqueString', async (req, res) => {
    const { uniqueString } = req.params;
    console.log("Received uniqueString from URL:", uniqueString);

    try {
        // Retrieve all records (or narrow it down if possible by another identifier like userId)
        const records = await UserVerification.find();
        let record = null;

        // Compare the hashed unique string with the received one
        for (const rec of records) {
            if (await bcrypt.compare(uniqueString, rec.uniqueString)) {
                record = rec;
                break;
            }
        }

        if (!record) {
            return res.status(404).json({
                status: "FAILED",
                message: "Verification link is invalid.",
            });
        }

        console.log("Record retrieved from DB:", record);

        // Check if the link has expired
        if (new Date(record.expiresAt).getTime() < Date.now()) {
            await UserVerification.deleteOne({ userId: record.userId }); // Cleanup expired record
            return res.status(400).json({
                status: "FAILED",
                message: "Verification link has expired.",
            });
        }

        // Update user's verification status
        await User.updateOne({ _id: record.userId }, { verified: true });

        // Delete the verification record
        await UserVerification.deleteOne({ userId: record.userId });

        res.redirect("/login");
    } catch (err) {
        console.error("Error during verification process:", err);
        res.status(500).json({
            status: "FAILED",
            message: "An error occurred during verification.",
    });
}
});

//Signin
Userrouter.post('/login', async(req,res) =>
{
    let{email, password,} = req.body;
    email = email.trim();
    password = password.trim();

    if(email === "" || password === ""){
        return res.status(404).json({
    status : "FAILED",
    message : "Empty credentials supplied"
});
}
else{
 //check if user exists
        User.findOne({ email })
.then(user => {
    if (!user) {
        // If no user is found
        return res.status(404).json({
            status: "FAILED",
            message: "Invalid credentials entered!"
        });
    }

    // Check if the user is verified
    if (!user.verified) {
        return res.status(404).json({
            status: "FAILED",
            message: "Email hasn't been verified yet. Check your inbox"
        });
    }

    // Compare the password
    bcrypt.compare(password, user.password)
        .then(isMatch => {
            if (isMatch) {
                return res.json({
                    status: "SUCCESS",
                    message: "SIGNIN SUCCESSFUL",
                    data: user // Send the user data, or any relevant details
                });
            } else {
                return res.status(401).json({
                    status: "FAILED",
                    message: "INVALID PASSWORD ENTERED!"
                });
            }
        })
        .catch(err => {
            return res.status(500).json({
                status: "FAILED",
                message: "An error occurred while comparing passwords"
            });
        });
})
.catch(err => {
    return res.status(500).json({
        status: "FAILED",
        message: "An error occurred while checking for existing user"
    });
});
}
});

//Password reset stuff
Userrouter.post("/requestPasswordReset",(req,res) =>
{
    const {email,redirectUrl} = req.body;

    //check if email exists
    User
    .find({email})
    .then((data) => {
        if(data.length){
            //user exists

            //check if user is verified
            if(!data[0].verified) {
                res.json({
                    status : "FAILED",
                    message : "Email hasn't been verified yet. Check your inbox",
                });
            } else {
                // proceed with email to reset password
                sendResetEmail(data[0],redirectUrl,res);
            }
        }
        else {
            res.json({
                status : "FAILED",
                message : "No account with the supplied email exists!"
            });
        }
    })
    .catch(error =>{
        console.log(error);
        res.json({
            status : "FAILED",
            message : "An error occured while checking for existing user",
        });
    });
});

//send password reset email
const sendResetEmail = ({_id, email}, redirectUrl, res ) =>{
     const resetString = uuidv4() + _id;

     console.log("Redirect URL:", redirectUrl);
    console.log("User ID:", _id);
     console.log("Reset String:", resetString);
const encodedRedirectUrl = `${redirectUrl}/${_id}/${resetString}`;
     //First, we clear all existing reset records
     PasswordReset.deleteMany({ userId : _id})
     .then(result => {
        //reset records deleted successfully 
        //Now we send the email

        //mail options
        const mailOptions ={
            from: process.env.AUTH_EMAIL,
            to: email,
            subject: "Password reset",
            html: `
              <p>We heard that you lost the password.</p>
              <p>Don't worry, use the link below to reset it.</p>
              <p>This link <b>expires in 1 hour</b>.</p>
              <p>Press <a href="${encodedRedirectUrl}">here</a> to proceed.</p>
            `    
        };
       
        //hash the reset string
         const saltRounds = 10;
         bcrypt.hash(resetString, saltRounds).then(hashedResetString =>{
            //set values in password reset collection
            const newPasswordReset = new PasswordReset({
                  userId : _id,
                  uniqueString: hashedResetString,
                  createdAt: new Date(),
                  expiresAt: new Date(Date.now() + 3600000), //1 hour
            });
           newPasswordReset.save()
           .then(() => {
             transporter.sendMail(mailOptions)
             .then(() => {
                //reset email sent and password
                res.json({
                    status : "PENDING",
                    message : "Password reset email sent",
                })
             })
             .catch(error => {
                console.log(error);
                return res.status(500).json({
                    status : "FAILED",
                    message : "Password reset email failed!",
                });
             })

           })
           .catch(error => {
            console.log(error);
            return res.status(500).json({
                status : "FAILED",
                message : "Couldn't save password reset data!",
            });
           })
         }).catch(error => {
            console.log(error);
            return res.status(500).json({
                status : "FAILED",
                message : "An error occured while hashing the password reset data!",
            });

         })

     })
     .catch(error => {
        console.log(error);
        res.json({
            status : "FAILED",
            message : "Clearing existing password reset records failed",
        });
     })
}

Userrouter.post("/requestPasswordReset/:userId/:resetString", async (req, res) => {
    const { userId, resetString } = req.params;
    // console.log("mai yha hu",userId);
    const { newPassword,confirmPassword } = req.body;
  
    if (!newPassword || !confirmPassword) {
      return res.status(400).json({
        status: "FAILED",
        message: "New password and confirmation password are required.",
      });
    }
  
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        status: "FAILED",
        message: "Passwords do not match.",
      });
    }
  
    try {
      // Check if the reset link exists
      const resetRecord = await PasswordReset.findOne({ userId });
  
      if (!resetRecord) {
        return res.status(404).json({
          status: "FAILED",
          message: "Invalid or expired reset link.",
        });
      }
  
      // Check if the reset link has expired
      if (Date.now() > resetRecord.expiresAt) {
        await PasswordReset.deleteOne({ userId }).catch((error) => {
          console.error(error);
          return res.status(500).json({
            status: "FAILED",
            message: "An error occurred while deleting expired reset record.",
          });
        });
  
        return res.status(400).json({
          status: "FAILED",
          message: "Reset link has expired.",
        });
      }
  
      // Compare reset string
      const isMatch = await bcrypt.compare(resetString, resetRecord.uniqueString).catch((error) => {
        console.error(error);
        return res.status(500).json({
          status: "FAILED",
          message: "An error occurred while comparing the reset string.",
        });
      });
  
      if (!isMatch) {
        return res.status(400).json({
          status: "FAILED",
          message: "Invalid reset link.",
        });
      }
  
      // Hash the new password and update it
      const hashedPassword = await bcrypt.hash(newPassword, 10).catch((error) => {
        console.error(error);
        return res.status(500).json({
          status: "FAILED",
          message: "An error occurred while hashing the new password.",
        });
      });
  
      await User.updateOne({ _id: userId }, { password: hashedPassword }).catch((error) => {
        console.error(error);
        return res.status(500).json({
          status: "FAILED",
          message: "An error occurred while updating the password.",
        });
      });
  
      // Delete the password reset record after successful password change
      await PasswordReset.deleteOne({ userId }).catch((error) => {
        console.error(error);
        return res.status(500).json({
          status: "FAILED",
          message: "An error occurred while deleting the password reset record.",
        });
      });
  
      res.status(200).json({
        status: "SUCCESS",
        message: "Password reset successfully.",
      });
  
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        status: "FAILED",
        message: "An error occurred while resetting the password.",
      });
    }
  });



module.exports = Userrouter;

//localhost:5500/user/requestPasswordReset/674ca123d07dff4f89bfea47/27095f4f-f7af-4eaf-a8bf-61f4167dc211674ca123d07dff4f89bfea47

