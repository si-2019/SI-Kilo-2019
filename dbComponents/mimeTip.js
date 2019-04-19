const Sequelize = require("sequelize");

module.exports = function(sequelize){
    const Zadatak = sequelize.define("zadatak",{
        idZadatka : Sequelize.INTEGER,
        mimeTip : Sequelize.STRING
    })
    return Zadatak;
};