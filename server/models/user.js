const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim:true,
  },
  cr: {
    type: Boolean,
    default:false,
  },
  email:{
    type: String,
    unique:true,
    required: true,
    unique:true,
    trim: true,
    lowercase: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error('Email is Invalid');
      }
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 7,
    validate(value) {
      if (value.toLowerCase() .includes('password')) {
        throw new Error('Give a Strong Password');
      }
    }
  },
  tokens: [
    {
      token: {
        type: String,
        required:true
      }
    },
  ],
  uid: {
    type: Number,
    minlength: 10,
    default: 0000000000,
    trim: true,
  }
});

//generating auth token
userSchema.methods.generateAuthToken = async function() {
  const user = this;
  const token=jwt.sign({_id:user._id.toString()},"myBunkManagerApp")
  user.tokens = user.tokens.concat({ token: token });
  await user.save();
  return token;
};

//remove password and tokens array from the response JSON
userSchema.methods.toJSON = function () {
  const user = this;

  const userObject = user.toObject();

  delete userObject.password;
  delete userObject.tokens;

  return userObject;
};

//checking authentication
userSchema.statics.findByCredentials = async(email, password) =>{
  const user = await User.findOne({email:email});

  if (!user) {
    throw new Error("No user found with that email");
  }

  const isMatch = await bcrypt.compare(password,user.password);

  if (!isMatch) {
    throw new Error("Email or Password wrong.Try Again");
  }
  return user;
};

//hash the password
userSchema.pre('save', async function (next) {
  const user = this;

  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  
  next();
});


const User =mongoose.model('User', userSchema);

module.exports = User;