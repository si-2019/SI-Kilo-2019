const Sequelize = require("sequelize");

const sequelize = new Sequelize(
    //zajednicka baza
   "TYQcLL35gV", // database
    "TYQcLL35gV", // username
    "BLysSj9ZrP", // password
    
   
/*
    //kilo baza
 "p71oGbEV4z", // database
 "p71oGbEV4z", // username
 "dE0kCM9D1r", // password
*/
    {   
        host:"37.59.55.185", 
        dialect:"mysql", 
        timezone: '+01:00',
        define: {
            timestamps: false
        }
    });

const db={};

db.Sequelize = Sequelize;  
db.sequelize = sequelize;

//import modela
db.Zadaca = sequelize.import(__dirname + '/zadaca.js');
db.Zadatak = sequelize.import(__dirname + '/zadatak.js');
db.MimeTip = sequelize.import(__dirname + '/mimeTip.js');
//db.Korisnik = sequelize.import(__dirname + '/korisnik.js');
db.StudentZadatak = sequelize.import(__dirname + '/student_zadatak.js');

//relacije
db.Zadaca.hasMany(db.Zadatak, {as: 'zadaci' , foreignKey: 'idZadaca' });
db.Zadatak.hasMany(db.MimeTip, {as: 'mimeTipovi' , foreignKey: 'idZadatak' });
//db.Korisnik.belongsToMany(db.Zadatak,{as:'zadaci', through: db.StudentZadatak, foreignKey:'id'});
//db.Zadatak.belongsToMany(db.Korisnik,{as:'korisnici', through: db.StudentZadatak, foreignKey:'idZadatak'});
db.Zadatak.hasMany(db.StudentZadatak, {as: 'studentZadaci' , foreignKey: 'idZadatak' });

module.exports = db;