const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    tgId: {
        type: String,
        required: true,
        unique: true
    },

    firstName : {
        type: String,
        required: true,
    },
    lastName : {
        type: String,
        required: true,
    },
    isbot: {
        type: Boolean,
        required: true,
    },
    promptToken : {
        type: Number,
        required: false
    },
    completionToken: {
        type: Number,
        required: false
    }
},{timestamps: true})


const User = new mongoose.model("User" , userSchema)
module.exports = User