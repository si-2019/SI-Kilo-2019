const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const db = require('./dbComponents/db.js');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'))

db.sequelize.sync({force:false}).then(() => {
    console.log("Usao u bazu!");
}).catch((e) => {
    console.log("greska");
    console.log(e);
});


app.post('/addZadaca', function(req, res) {
    
    var bodyReq = req.body;
    



    res.end("test1");
});

app.listen(6001);