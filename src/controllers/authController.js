const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth.json');

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

module.exports = app => app.use('/auth', router);