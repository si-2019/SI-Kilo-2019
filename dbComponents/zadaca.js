const Sequelize = require("sequelize");

module.exports = function(sequelize){
    const Zadaca = sequelize.define("zadaca",{
        idPredmet  : Sequelize.INTEGER,
        brojZadataka : Sequelize.INTEGER,
        rokZaPredaju : Sequelize.DATE,
        maxBrojBodova : Sequelize.INTEGER,
        ukupnoOstvareniBodovi : Sequelize.INTEGER,
        postavkaZadace : Sequelize.BLOB
    })
    return Zadaca;
};