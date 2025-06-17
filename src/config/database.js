import pg from 'pg';
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

console.log('Loaded DATABASE_URL:', process.env.DATABASE_URL);

const db = new Sequelize(process.env.DATABASE_URL, {
    logging: false,
    protocol: 'postgres',
    dialectModule: pg,
    dialectOptions:{
        ssl:{
            require:true,
            rejectUnauthorized: false // This is important for self-signed certificates
        }
    }
});

export {db};