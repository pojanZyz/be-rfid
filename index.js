import { Server } from 'socket.io';
import http from 'http';
import redis from './src/config/redis.js';
import express from 'express';
import { db } from './src/config/database.js';
import authRoutes from './src/routes/auth.js';
import trolleyRoutes from './src/routes/trolleys.js';
import trolleyStatusRoutes from './src/routes/trolley-statuses.js';
import locationRoutes from './src/routes/locations.js';
import trolleyLocationLogRoutes from './src/routes/trolley-location-log.js';
import userMonitoringRoutes from './src/routes/user-monitoring.js';
import userRoleRoutes from './src/routes/user-role.js';
import { startTrolleyLocationConsumer } from './src/queue/trolleyLocationConsumer.js';
import cors from 'cors';

const app = express();
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/trolleys', trolleyRoutes);
app.use('/trolley-statuses', trolleyStatusRoutes);
app.use('/locations', locationRoutes);
app.use('/', trolleyLocationLogRoutes);
app.use(userMonitoringRoutes);
app.use(userRoleRoutes);

app.set('redis', redis);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
app.set('io', io);

const initializeDatabase = async () =>{
    try{
        // console.log('Migrating database tables (sync with alter)...');
        // await db.sync({ force: false, alter: true });
        await db.authenticate();
        // console.log('Database migration & connection established successfully.');
    } catch (error){
        console.error('unable to connnect to database: ', error);
    }
}
initializeDatabase();

startTrolleyLocationConsumer(io); // Mulai consumer RabbitMQ

server.listen(4000, () => {
    console.log('Server is running on port 4000');
});
