const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    name : { type : String, required : true,},
    dateofBirth : { type : Date, required : true,},
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    otp: { type: String },
    otpExpires: { type: Date },
    isVerified: { type: Boolean, default: false },
});

const User = mongoose.model('User', UserSchema);

module.exports = mongoose.model('User', UserSchema);