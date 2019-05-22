const Sequelize = require("sequelize");

module.exports = function(sequelize){
    const Zadatak = sequelize.define("zadatak",{
        idZadatak : {type: Sequelize.INTEGER, primaryKey : true, autoIncrement : true},
        idZadaca  : Sequelize.INTEGER,
        redniBrojZadatkaUZadaci : Sequelize.INTEGER,
        maxBrojBodova : Sequelize.INTEGER,
    }, {
        timestamps: false,
        freezeTableName: true,
        tableName: 'Zadatak' 
    })
    return Zadatak;
};
