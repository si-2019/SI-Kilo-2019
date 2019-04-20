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
db.Zadaca = sequelize.import(__dirname + '/zadaca.js');
db.Zadatak = sequelize.import(__dirname + '/zadatak.js');
db.MimeTip = sequelize.import(__dirname + '/mimeTip.js');

//relacije
db.Zadaca.hasMany(db.Zadatak, {as: 'zadaci' , foreignKey: 'idZadaca' });
db.Zadatak.hasMany(db.MimeTip, {as: 'mimeTipovi' , foreignKey: 'idZadatak' });

module.exports = db;