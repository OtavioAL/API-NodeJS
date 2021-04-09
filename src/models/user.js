const mongoose = require('../database');
const bcrypt = require('bcryptjs');
//Schema os campos que vamos ter dentro da tabela 
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    require: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    //Responsavel por nao deixar com que em uma busca a senha apareca junto
    select: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

//Antes de salvar
UserSchema.pre('save', async function(next){
  const hash = await bcrypt.hash(this.password, 10);
  this.password = hash;
  next();
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
