import getLocationModel from '../models/location.js';
import { db } from '../config/database.js';
import Redis from 'ioredis';
import amqp from 'amqplib';

const Location = getLocationModel(db);
const redis = new Redis();
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const QUEUE = 'location_events';

async function sendToRabbitMQ(event, data) {
    const conn = await amqp.connect(RABBITMQ_URL);
    const ch = await conn.createChannel();
    await ch.assertQueue(QUEUE, { durable: false });
    ch.sendToQueue(QUEUE, Buffer.from(JSON.stringify({ event, data })));
    setTimeout(() => { ch.close(); conn.close(); }, 500);
}

export const addLocation = async (req, res) => {
    try {
        const { name, description, x_coordinate, y_coordinate, z_coordinate } = req.body;
        if (!name) return res.status(400).json({ status: 'error', message: 'name harus diisi', error: 400 });
        const location = await Location.create({ name, description, x_coordinate, y_coordinate, z_coordinate });
        await redis.set(`location:${location.id}`, JSON.stringify(location));
        await sendToRabbitMQ('add', location);
        req.app.get('io').emit('location_update', { action: 'add', data: location });
        return res.status(201).json({ status: true, message: 'Lokasi berhasil ditambahkan', data: location });
    } catch (err) {
        return res.status(500).json({ status: 'error', message: 'Gagal menambah lokasi', error: 500 });
    }
};

export const updateLocation = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, x_coordinate, y_coordinate, z_coordinate } = req.body;
        const location = await Location.findByPk(id);
        if (!location) return res.status(404).json({ status: 'error', message: 'Lokasi tidak ditemukan', error: 404 });
        await location.update({ name, description, x_coordinate, y_coordinate, z_coordinate });
        await redis.set(`location:${location.id}`, JSON.stringify(location));
        await sendToRabbitMQ('update', location);
        req.app.get('io').emit('location_update', { action: 'update', data: location });
        return res.status(200).json({ status: true, message: 'Lokasi berhasil diubah', data: location });
    } catch (err) {
        return res.status(500).json({ status: 'error', message: 'Gagal mengubah lokasi', error: 500 });
    }
};

export const deleteLocation = async (req, res) => {
    try {
        const { id } = req.params;
        const location = await Location.findByPk(id);
        if (!location) return res.status(404).json({ status: 'error', message: 'Lokasi tidak ditemukan', error: 404 });
        const now = new Date();
        await location.update({ deleted_at: now, updated_at: now });
        await redis.del(`location:${id}`);
        await sendToRabbitMQ('delete', { id });
        req.app.get('io').emit('location_update', { action: 'delete', data: { id } });
        return res.status(200).json({ status: true, message: 'Lokasi berhasil dihapus', data: { id } });
    } catch (err) {
        return res.status(500).json({ status: 'error', message: 'Gagal menghapus lokasi', error: 500 });
    }
};
