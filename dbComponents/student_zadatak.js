const Sequelize = require("sequelize");

module.exports = function(sequelize){
    const StudentZadatak = sequelize.define("studentZadatak",{
        idStudentZadatak : {type: Sequelize.INTEGER, primaryKey : true, autoIncrement : true},
        idStudent : Sequelize.INTEGER,
        idZadatak : Sequelize.INTEGER,
        brojOstvarenihBodova : Sequelize.DOUBLE,
        datumIVrijemeSlanja : Sequelize.DATE,
        velicinaDatoteke : Sequelize.INTEGER, // velicina je izrazena u MB
        komentar : Sequelize.STRING,
        tipDatoteke : Sequelize.STRING,
        datoteka : Sequelize.BLOB('long'),
        stanjeZadatka : Sequelize.INTEGER,
        nazivDatoteke: Sequelize.STRING,
        mimeTipFajla : Sequelize.STRING
    }, {
        timestamps: false,
        freezeTableName: true,
        tableName: 'student_zadatak' 
    })
    return StudentZadatak;
};