import amqp from 'amqplib';
import Redis from 'ioredis';
import getTrolleyModel from '../models/trolley.js';
import getTrolleyLocationLogModel from '../models/trolley_location_log.js';
import { db } from '../config/database.js';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const QUEUE = 'trolley_location_logs';
const redis = new Redis();
const Trolley = getTrolleyModel(db);
const TrolleyLocationLog = getTrolleyLocationLogModel(db);

export const startTrolleyLocationConsumer = async (io) => {
    const conn = await amqp.connect(RABBITMQ_URL);
    const ch = await conn.createChannel();
    await ch.assertQueue(QUEUE, { durable: false });
    ch.consume(QUEUE, async (msg) => {
        if (msg !== null) {
            try {
                const data = JSON.parse(msg.content.toString());
                // Update posisi troli di Redis
                const redisKey = `trolley:position:${data.trolley_id}`;
                await redis.set(redisKey, JSON.stringify(data));
                // Push ke frontend via WebSocket
                if (io) {
                    io.emit('trolley_position_update', data);
                }
                // Simpan ke DB (log lokasi)
                await TrolleyLocationLog.create({
                    trolley_id: data.trolley_id,
                    location_id: data.location_id,
                    detected_by: data.detected_by,
                    x_offset: data.x_offset,
                    y_offset: data.y_offset,
                    z_offset: data.z_offset,
                    detected_at: data.detected_at
                });
                ch.ack(msg);
            } catch (err) {
                console.error('Gagal proses log lokasi troli:', err);
                ch.nack(msg, false, false); // buang pesan jika gagal
            }
        }
    });
};
