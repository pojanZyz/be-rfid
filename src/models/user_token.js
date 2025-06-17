import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class UserToken extends Model {
    static associate(models) {
      // associations can be defined here
    }
  }
  UserToken.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    refresh_token: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    expires_at: DataTypes.DATE,
    revoked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'UserToken',
    tableName: 'user_tokens',
    timestamps: false
  });
  return UserToken;
};
