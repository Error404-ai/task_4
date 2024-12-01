const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserOTPVerificationSchema = new Schema({
    userId: { type: String },
    otp: { type: String, unique: true },
     createdAt: { type: Date },
     expiresAt: { type: Date },
});

const UserOTPVerification = mongoose.model('UserOTPVerification', UserOTPVerificationSchema);

module.exports = UserOTPVerification;
