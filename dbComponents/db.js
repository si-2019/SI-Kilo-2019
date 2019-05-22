const Sequelize = require("sequelize");
const sequelize = new Sequelize(
    "TYQcLL35gV", // database
    "TYQcLL35gV", // username
    "BLysSj9ZrP", // password
    {host:"37.59.55.185", dialect:"mysql", timezone: '+01:00'});

const db={};

db.Sequelize = Sequelize;  
db.sequelize = sequelize;

//import modela
db.Zadaca = sequelize.import(__dirname + '/zadaca.js');
db.Zadatak = sequelize.import(__dirname + '/zadatak.js');
db.MimeTip = sequelize.import(__dirname + '/mimeTip.js');
//db.StudentZadatak = sequelize.import(__dirname + '/student_zadatak.js');

//relacije
db.Zadaca.hasMany(db.Zadatak, {as: 'zadaci' , foreignKey: 'idZadaca' });
db.Zadatak.hasMany(db.MimeTip, {as: 'mimeTipovi' , foreignKey: 'idZadatak' });
//db.Zadatak.belongsToMany(db.Student// student moram importovati u db.student)

module.exports = db;