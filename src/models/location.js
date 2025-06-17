import { Model, DataTypes } from 'sequelize';
export default (sequelize) => {
  class Location extends Model {
    static associate(models) {
      // associations can be defined here
    }
  }
  Location.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: DataTypes.TEXT,
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    x_coordinate: DataTypes.DECIMAL,
    y_coordinate: DataTypes.DECIMAL,
    z_coordinate: DataTypes.DECIMAL
  }, {
    sequelize,
    modelName: 'Location',
    tableName: 'locations',
    timestamps: false
  });
  return Location;
};
