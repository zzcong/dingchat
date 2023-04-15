const { default: mongoose } = require("mongoose");

const Token = new mongoose.Schema({
  token: String,
  expiredAt: Number
}, {timestamps: true})

module.exports = mongoose.model('token', Token)