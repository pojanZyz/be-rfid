import db from '../models/index.js';
import { Op } from 'sequelize';

const { TrolleyStatus } = db;

export const getTrolleyStatuses = async (req, res) => {
  // Tidak menerima query parameter, jika ada return error
  if (Object.keys(req.query).length > 0) {
    return res.status(400).json({ status: 'error', message: 'Parameter tidak valid', error: 400 });
  }
  try {
    const statuses = await TrolleyStatus.findAll({
      where: { deleted_at: null },
      attributes: ['id', 'name', 'description', 'created_at', 'updated_at', 'deleted_at']
    });
    return res.json({
      status: true,
      message: 'Success',
      data: statuses
    });
  } catch (err) {
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

export const createTrolleyStatus = async (req, res) => {
  const { name, description } = req.body;
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ status: 'error', message: "Property 'name' harus diisi dan berupa string", error: 400 });
  }
  try {
    // Cek duplikat
    const exist = await TrolleyStatus.findOne({ where: { name, deleted_at: null } });
    if (exist) {
      return res.status(400).json({ status: 'error', message: 'Nama status sudah ada', error: 400 });
    }
    const status = await TrolleyStatus.create({ name, description });
    return res.status(201).json({
      status: true,
      message: 'Status berhasil dibuat',
      data: {
        id: status.id,
        name: status.name,
        description: status.description,
        created_at: status.created_at,
        updated_at: status.updated_at,
        deleted_at: status.deleted_at
      }
    });
  } catch (err) {
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

export const updateTrolleyStatus = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  try {
    const status = await TrolleyStatus.findOne({ where: { id } });
    if (!status) {
      return res.status(404).json({ status: 'error', message: 'Status troli tidak ditemukan', error: 404 });
    }
    if (status.deleted_at) {
      return res.status(410).json({ status: 'error', message: 'Status troli sudah dihapus sebelumnya', error: 410, deleted_at: status.deleted_at });
    }
    if (name && typeof name !== 'string') {
      return res.status(400).json({ status: 'error', message: "Property 'name' harus diisi dan berupa string", error: 400 });
    }
    status.name = name ?? status.name;
    status.description = description ?? status.description;
    status.updated_at = new Date();
    await status.save();
    return res.json({
      status: true,
      message: 'Status berhasil diperbarui',
      data: {
        id: status.id,
        name: status.name,
        description: status.description,
        created_at: status.created_at,
        updated_at: status.updated_at,
        deleted_at: status.deleted_at
      }
    });
  } catch (err) {
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

export const deleteTrolleyStatus = async (req, res) => {
  const { id } = req.params;
  try {
    const status = await TrolleyStatus.findOne({ where: { id } });
    if (!status) {
      return res.status(404).json({ status: 'error', message: 'Status troli tidak ditemukan', error: 404 });
    }
    if (status.deleted_at) {
      return res.status(410).json({ status: 'error', message: 'Status troli sudah dihapus sebelumnya', error: 410, deleted_at: status.deleted_at });
    }
    status.deleted_at = new Date();
    await status.save();
    return res.json({
      status: true,
      message: 'Status berhasil dihapus (soft delete)',
      data: {
        id: status.id,
        deleted_at: status.deleted_at
      }
    });
  } catch (err) {
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};
