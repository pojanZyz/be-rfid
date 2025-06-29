import { Model, DataTypes } from 'sequelize';
export default (sequelize) => {
  class RFIDReader extends Model {
    static associate(models) {
      RFIDReader.belongsTo(models.Location, { foreignKey: 'location_id', as: 'location' });
    }
  }
  RFIDReader.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    device_code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    location_id: {
      type: DataTypes.UUID,
      references: { model: 'locations', key: 'id' }
    },
    ip_address: DataTypes.STRING,
    status: {
      type: DataTypes.STRING,
      defaultValue: 'active'
    },
    last_online: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'RFIDReader',
    tableName: 'rfid_readers',
    timestamps: false
  });
  return RFIDReader;
};
