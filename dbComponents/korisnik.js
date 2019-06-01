module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Korisnik', {
      idKorisnik: {
        type: DataTypes.INTEGER(10),
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      }
    }, {
      tableName: 'Korisnik'
    });
  };