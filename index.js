import { Server } from 'socket.io';
import http from 'http';
import redis from './src/config/redis.js';
import express from 'express';
import { db } from './src/config/database.js';
import authRoutes from './src/routes/auth.js';
import trolleyRoutes from './src/routes/trolleys.js';
import trolleyStatusRoutes from './src/routes/trolley-statuses.js';

const app = express();
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/trolleys', trolleyRoutes);
app.use('/trolley-statuses', trolleyStatusRoutes);

app.set('redis', redis);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
app.set('io', io);

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

server.listen(4000, () => {
    console.log('Server is running on port 4000');
});
