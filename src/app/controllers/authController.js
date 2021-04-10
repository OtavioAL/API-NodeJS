const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const authConfig = require('../../config/auth.json');
const mailer = require('../../modules/mailer');

const User = require('../models/user');

const router = express.Router();

function generationToken(params = {}){
  return jwt.sign( params, authConfig.secret, {
    expiresIn: 86400,
  });
}

router.post('/register', async(req, res) => {
  try{

    const { email } = req.body;

    //Verificando pelo email que deve ser unico se um usuario ja existe
    if(await User.findOne({ email }))
      return res.status(400).send({ error: 'User already exists' });

    const user = await User.create(req.body);

    user.password = undefined;

    return res.send({ 
      user, 
      token: generationToken({ id: user.id }),
    });
  }catch(err){
    return res.status(400).send({ error: 'Registration Failed' });
  }
});

router.post('/authenticate', async(req, res) =>{
  const { email, password } = req.body;

  /*
    Necessario o select('+.password') pois estava definido na tabela que
    em uma buscas não era para informar o password com isso ira fazer
    com que seja possivel obter o password na busca realizada
  */
  const user = await User.findOne({ email }).select('+password');

  if(!user)
    return res.status(400).send({ error: 'Use not found' });

  if(!await bcrypt.compare(password, user.password))
    return res.status(400).send({ error:'Invalid password' });

  user.password = undefined;

  res.send({ 
    user, 
    token: generationToken({ id: user.id }),
  });

});

router.post('/forgot_password', async(req, res) => {
  const { email } = req.body;

  try{
    //Fazendo a busca pelo email do usuario
    const user = await User.findOne({ email });
    if(!user){
      return res.status(400).send({ error: 'User not found' });
    }
    //Criando um token aleatorio
    const token = crypto.randomBytes(20).toString('hex');
    const now = new Date();
    //Definindo um tempo para que o token expire (1 hora)
    now.setHours(now.getHours() + 1); 
    await User.findByIdAndUpdate(user.id, {
      '$set': {
        passwordResetToken: token,
        passwordResetExpires: now,
      },
      useFindAndModify: false,
    });

    mailer.sendMail({
      //Definindo para queem eu quero enviar o email
      to: email,
      from: 'otavioaug2@gmail.com',
      template: 'auth/forgot_password',
      html: `<p>Esqueceu a senha? Sem problemas, use este token para redefinir a senha: ${token} </p>`,
    }, (err) => {
      if(err)
        return res.status(400).send({ error: 'Cannot send forgot password email' });
      return res.send();
    });
  }catch(err) {
    res.status(400).send({ error: 'Error on forgot password, try again' });
  }
});

router.post('/reset_password', async(req, res) => {
  const { email, token, password } = req.body;

  try{
    const user = await User.findOne({ email })
      .select('+passwordResetToken passwordResetExpires');
    
    //Verificando se o usuario foi encontrado
    if(!user)
      return res.status(400).send({ error: 'User not found' });
    //Verificando se o token informado é diferente do token enviado
    if(token !== user.passwordResetToken)
      return res.status(400).send({ error: 'Token invalid' });
    //Verificando se o token ainda nao expirou
    const now = new Date();
    if(now > user.passwordResetExpires)
      return res.status(400).send({ error: 'Token expired, generate a new one' });

    user.password = password;

    await user.save();

    res.send();

  }catch(err){
    res.status(400).send({ error: 'Cannot reset password, try again' });
  }

});

module.exports = app => app.use('/auth', router);