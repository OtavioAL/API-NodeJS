//Express e responsavel pelas tratativas de rotas e request 
const express = require('express');
/*
    body-parser responsavel por fazer com que o node entenda as requisicoes 
    em json e entender os parametros passados pela url
*/
const bodyParser = require('body-parser');

const app = express();

/*
    Utilizado para que ele entenda quando eu enviar uma requisicao para API com
    informacoes em json
*/
app.use(bodyParser.json());
//Para que entenda quando parametros forem passados via url
app.use(bodyParser.urlencoded({ extended: false }));

require('./controllers/authController')(app);
require('./controllers/projectController')(app);

app.listen(3000);