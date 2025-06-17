import express from 'express';
import { db } from './src/config/database.js';
import authRoutes from './src/routes/auth.js';
import trolleyRoutes from './src/routes/trolleys.js';

const app = express();
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/trolleys', trolleyRoutes);

const initializeDatabase = async () =>{
    try{
        db.sync({ force: false, alter: true });
        db.authenticate();
        console.log('Database connection has been established successfully.');
    } catch (error){
        console.error('unable to connnect to database: ', error);
    }
}
initializeDatabase();

app.listen(4000, () => {
    console.log('Server is running on port 4000');
})