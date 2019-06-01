const Sequelize = require("sequelize");
const sequelize = new Sequelize("bazasi","root","",{host:"localhost",dialect:"mysql",logging:false});

const db={};

db.Sequelize = Sequelize;  
db.sequelize = sequelize;

//import modela
db.Zadaca = sequelize.import(__dirname + '/zadaca.js');
db.Zadatak = sequelize.import(__dirname + '/zadatak.js');
db.MimeTip = sequelize.import(__dirname + '/mimeTip.js');
db.Korisnik = sequelize.import(__dirname + '/korisnik.js');
db.StudentZadatak = sequelize.import(__dirname + '/student_zadatak.js');

//relacije
db.Zadaca.hasMany(db.Zadatak, {as: 'zadaci' , foreignKey: 'idZadaca' });
db.Zadatak.hasMany(db.MimeTip, {as: 'mimeTipovi' , foreignKey: 'idZadatak' });

db.Korisnik.belongsToMany(db.Zadatak,{as:'zadaci', through: db.StudentZadatak, foreignKey:'idStudent'});
db.Zadatak.belongsToMany(db.Korisnik,{as:'korisnici', through: db.StudentZadatak, foreignKey:'idZadatak'});

module.exports = db;