const Sequelize = require("sequelize");

module.exports = function(sequelize){
    const MimeTip = sequelize.define("mimeTip",{
        idMimeTip : {type: Sequelize.INTEGER, primaryKey : true, autoIncrement : true},
        idZadatak : Sequelize.INTEGER,
        mimeTip : Sequelize.STRING
    }, {
        timestamps: false,
        freezeTableName: true,
        tableName: 'MimeTip' 
    })
    return MimeTip;
};