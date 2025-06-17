import { Model, DataTypes } from 'sequelize';
export default (sequelize) => {
  class TrolleyStatus extends Model {
    static associate(models) {
      // associations can be defined here
    }
  }
  TrolleyStatus.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'TrolleyStatus',
    tableName: 'trolley_statuses',
    timestamps: false
  });
  return TrolleyStatus;
};
