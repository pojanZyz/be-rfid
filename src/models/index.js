import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { db as sequelize } from '../config/database.js'; // Pakai instance dari config
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const basename = path.basename(__filename);

const db = {};

for (const file of fs.readdirSync(__dirname)) {
  if (
    file.indexOf('.') !== 0 &&
    file !== basename &&
    file.slice(-3) === '.js'
  ) {
    const fileUrl = pathToFileURL(path.join(__dirname, file)).href;
    const model = (await import(fileUrl)).default(sequelize);
    db[model.name] = model;
  }
}

// Setup associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = sequelize.constructor;

export default db;
