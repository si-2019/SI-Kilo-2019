const Sequelize = require("sequelize");
const sequelize = new Sequelize(
    "TYQcLL35gV", // database
    "TYQcLL35gV", // username
    "BLysSj9ZrP", // password
    {host:"37.59.55.185",dialect:"mysql"});

const db={};

db.Sequelize = Sequelize;  
db.sequelize = sequelize;

//import modela
db.zadaca = sequelize.import(__dirname + '/zadaca.js');
db.zadatak = sequelize.import(__dirname + '/zadatak.js');
db.mimeTip = sequelize.import(__dirname + '/mimeTip.js');

//relacije
db.zadaca.hasMany(db.zadatak, {as: 'zadaci' , foreignKey: 'idZadaca' });
db.zadatak.hasMany(db.mimeTip, {as: 'mimeTipovi' , foreignKey: 'idZadatak' });

module.exports=db;