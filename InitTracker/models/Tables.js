module.exports = function(sequelize, DataTypes) {
  var MonsterTable = sequelize.define("MonsterTable", {
    Type: DataTypes.STRING,
  });
  return MonsterTable;
};
