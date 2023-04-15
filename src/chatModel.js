const { default: mongoose } = require("mongoose");

const Chat = new mongoose.Schema({
  conversationId: String,
  role: String,
  roleName: String,
  content: String
}, {
  timestamps: true
})

module.exports = mongoose.model('chats', Chat)