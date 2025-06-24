import amqp from 'amqplib';
import getTrolleyModel from '../models/trolley.js';
import { db } from '../config/database.js';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const QUEUE = 'trolley_location_logs';
const Trolley = getTrolleyModel(db);

export const postTrolleyLocationLog = async (req, res) => {
    const { id } = req.params;
    const { location_id, detected_by, x_offset, y_offset, z_offset } = req.body;
    if (!location_id) {
        return res.status(400).json({
            status: 'error',
            message: 'location_id harus diisi',
            error: 400
        });
    }
    // Cek troli ada atau tidak
    const trolley = await Trolley.findByPk(id);
    if (!trolley) {
        return res.status(404).json({
            status: 'error',
            message: 'Troli dengan ID tersebut tidak ditemukan',
            error: 404
        });
    }
    // Kirim ke RabbitMQ
    try {
        const conn = await amqp.connect(RABBITMQ_URL);
        const ch = await conn.createChannel();
        await ch.assertQueue(QUEUE, { durable: false });
        const payload = {
            trolley_id: id,
            location_id,
            detected_by,
            x_offset,
            y_offset,
            z_offset,
            detected_at: new Date().toISOString()
        };
        ch.sendToQueue(QUEUE, Buffer.from(JSON.stringify(payload)));
        setTimeout(() => {
            ch.close();
            conn.close();
        }, 500);
        return res.status(201).json({
            status: true,
            message: 'Log lokasi berhasil dicatat',
            data: payload
        });
    } catch (err) {
        return res.status(500).json({
            status: 'error',
            message: 'Gagal mencatat log lokasi',
            error: 500
        });
    }
};
