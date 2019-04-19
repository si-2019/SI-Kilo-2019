const Sequelize = require("sequelize");

module.exports = function(sequelize){
    const Zadatak = sequelize.define("zadatak",{
        idZadaca  : Sequelize.INTEGER,
        nazivZadataka : Sequelize.STRING,
        maxBrojBodova : Sequelize.INTEGER,
        brojOstvarenihBodova : Sequelize.INTEGER,
        profesorovKomentar : Sequelize.STRING,
        datumPredaje : Sequelize.DATE,
        statusZadatka : Sequelize.STRING,
        sadrzajFile : Sequelize.BLOB,
        velicinaFile : Sequelize.INTEGER,
        mimeTipUpdateZadatka : Sequelize.STRING
    })
    return Zadatak;
};