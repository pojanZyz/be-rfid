import db from '../models/index.js';
import { Op } from 'sequelize';

const { Trolley, TrolleyStatus, Location, TrolleyLocationLog, User } = db;

export const createTrolley = async (req, res) => {
  try {
    const { rfid_code, trolley_code, status_id } = req.body;
    if (!rfid_code || !trolley_code || !status_id) {
      return res.status(400).json({ status: false, message: 'Data tidak lengkap' });
    }
    // Cari status berdasarkan nama
    const status = await TrolleyStatus.findOne({ where: { name: status_id } });
    if (!status) {
      return res.status(400).json({ status: false, message: 'Status tidak ditemukan' });
    }
    // Cek duplikat
    const exist = await Trolley.findOne({ where: { rfid_code } });
    if (exist) {
      return res.status(400).json({ status: false, message: 'RFID sudah terdaftar' });
    }
    const trolley = await Trolley.create({
      rfid_code,
      trolley_code,
      status_id: status.id,
      created_at: new Date()
    });
    // Redis cache posisi troli
    const redis = req.app.get('redis');
    const trolleyPosition = {
      id: trolley.id,
      rfid_code: trolley.rfid_code,
      trolley_code: trolley.trolley_code,
      status_id: trolley.status_id,
      created_at: trolley.created_at
    };
    await redis.set(`trolley:pos:${trolley.id}`, JSON.stringify(trolleyPosition));
    // Push ke frontend via WebSocket
    const io = req.app.get('io');
    io.emit('trolley:position:create', trolleyPosition);
    return res.status(201).json({
      status: true,
      message: 'Troli berhasil ditambahkan',
      data: trolleyPosition
    });
  } catch (err) {
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

export const getTrolleys = async (req, res) => {
  try {
    let {
      location_id,
      status_id,
      search,
      limit = 20,
      page = 1,
      z_coordinate
    } = req.query;
    limit = parseInt(limit);
    page = parseInt(page);
    if (isNaN(limit) || limit < 20) limit = 20;
    if (isNaN(page) || page < 1) page = 1;

    // UUID validation (simple regex)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (status_id && !uuidRegex.test(status_id)) {
      return res.status(400).json({ status: 'error', message: "Parameter 'status_id' harus berupa UUID yang valid", error: 400 });
    }
    if (location_id && !uuidRegex.test(location_id)) {
      return res.status(400).json({ status: 'error', message: "Parameter 'location_id' harus berupa UUID yang valid", error: 400 });
    }

    // Build filter
    const where = { deleted_at: null };
    if (status_id) where.status_id = status_id;
    if (location_id) where.current_location_id = location_id;
    if (search) {
      where[Op.or] = [
        { trolley_code: { [Op.iLike]: `%${search}%` } },
        { rfid_code: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Join Location for z_coordinate filter
    const include = [
      { model: TrolleyStatus, as: 'status', attributes: ['id', 'name'] },
      { model: Location, as: 'location', attributes: ['id', 'name', 'x_coordinate', 'y_coordinate', 'z_coordinate'] }
    ];
    if (z_coordinate !== undefined) {
      include[1].where = { z_coordinate: parseFloat(z_coordinate) };
    }

    // DEBUG LOG
    console.log('where:', where);
    console.log('include:', include);
    console.log('limit:', limit, 'page:', page);

    // Query with pagination
    const { count, rows } = await Trolley.findAndCountAll({
      where,
      include,
      limit,
      offset: (page - 1) * limit,
      order: [['created_at', 'DESC']]
    });

    if (count === 0) {
      return res.status(404).json({ status: false, message: 'Tidak ada troli yang cocok dengan filter pencarian', data: [], error: 404 });
    }

    const trolleys = rows.map(t => ({
      id: t.id,
      rfid_code: t.rfid_code,
      trolley_code: t.trolley_code,
      status: t.status ? { id: t.status.id, name: t.status.name } : null,
      location: t.location ? {
        id: t.location.id,
        name: t.location.name,
        x_coordinate: parseFloat(t.location.x_coordinate),
        y_coordinate: parseFloat(t.location.y_coordinate),
        z_coordinate: t.location.z_coordinate !== null ? parseFloat(t.location.z_coordinate) : 0.0
      } : null
    }));

    return res.json({
      status: true,
      message: 'Success',
      data: {
        trolleys,
        pagination: {
          page,
          limit,
          total: count
        }
      }
    });
  } catch (err) {
    console.error('GET /trolleys error:', err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

export const getTrolleyById = async (req, res) => {
  try {
    const { id } = req.params;
    const trolley = await Trolley.findOne({
      where: { id, deleted_at: null },
      include: [
        { model: TrolleyStatus, as: 'status', attributes: ['id', 'name'] }
      ]
    });
    if (!trolley) {
      return res.status(404).json({ status: false, message: 'Troli tidak ditemukan' });
    }
    // Ambil log lokasi
    const logs = await TrolleyLocationLog.findAll({
      where: { trolley_id: id },
      include: [{ model: Location, as: 'location', attributes: ['name'] }],
      order: [['detected_at', 'DESC']]
    });
    const location_logs = logs.map(log => ({
      location_name: log.location ? log.location.name : null,
      detected_at: log.detected_at
    }));
    // DEBUG LOG
    console.log('trolley:', trolley);
    console.log('logs:', logs);
    return res.json({
      status: true,
      message: 'Success',
      data: {
        id: trolley.id,
        rfid_code: trolley.rfid_code,
        trolley_code: trolley.trolley_code,
        status: trolley.status ? { id: trolley.status.id, name: trolley.status.name } : null,
        location_logs,
        created_at: trolley.created_at,
        updated_at: trolley.updated_at
      }
    });
  } catch (err) {
    console.error('GET /trolleys/:id error:', err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

export const updateTrolley = async (req, res) => {
  try {
    const { id } = req.params;
    const { rfid_code, trolley_code, status_id } = req.body;
    const trolley = await Trolley.findByPk(id);
    if (!trolley) {
      return res.status(404).json({ status: false, message: 'Troli tidak ditemukan' });
    }
    // Cari status berdasarkan nama
    const status = await TrolleyStatus.findOne({ where: { name: status_id } });
    if (!status) {
      return res.status(400).json({ status: false, message: 'Status tidak ditemukan' });
    }
    await trolley.update({
      rfid_code,
      trolley_code,
      status_id: status.id,
      updated_at: new Date()
    });
    // Redis cache posisi troli
    const redis = req.app.get('redis');
    const trolleyPosition = {
      id: trolley.id,
      rfid_code: trolley.rfid_code,
      trolley_code: trolley.trolley_code,
      status_id: trolley.status_id,
      updated_at: trolley.updated_at
    };
    await redis.set(`trolley:pos:${trolley.id}`, JSON.stringify(trolleyPosition));
    // Push ke frontend via WebSocket
    const io = req.app.get('io');
    io.emit('trolley:position:update', trolleyPosition);
    return res.json({
      status: true,
      message: 'Troli berhasil diperbarui',
      data: trolleyPosition
    });
  } catch (err) {
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

export const deleteTrolley = async (req, res) => {
  try {
    const { id } = req.params;
    const trolley = await Trolley.findByPk(id);
    if (!trolley) {
      return res.status(404).json({ status: false, message: 'Troli tidak ditemukan' });
    }
    await trolley.update({ deleted_at: new Date() });
    // Hapus posisi dari Redis
    const redis = req.app.get('redis');
    await redis.del(`trolley:pos:${trolley.id}`);
    // Push ke frontend via WebSocket
    const io = req.app.get('io');
    io.emit('trolley:position:delete', { id: trolley.id, deleted_at: trolley.deleted_at });
    return res.json({
      status: true,
      message: 'Troli berhasil dihapus',
      data: {
        id: trolley.id,
        deleted_at: trolley.deleted_at
      }
    });
  } catch (err) {
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

export const getTrolleyLogs = async (req, res) => {
  try {
    const { id } = req.params;
    const logs = await TrolleyLocationLog.findAll({
      where: { trolley_id: id },
      include: [
        { model: Location, as: 'location', attributes: ['name'] },
        { model: User, as: 'detectedBy', attributes: ['fullname'] }
      ],
      order: [['detected_at', 'DESC']]
    });
    const data = logs.map(log => ({
      id: log.id,
      location_name: log.location ? log.location.name : null,
      detected_at: log.detected_at,
      detected_by: log.detectedBy ? log.detectedBy.fullname : null
    }));
    return res.json({
      status: true,
      message: 'Success',
      data
    });
  } catch (err) {
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

export const getTrolleyLocationByRfid = async (req, res) => {
  try {
    const { rfid } = req.params;
    const trolley = await Trolley.findOne({ where: { rfid_code: rfid, deleted_at: null }, include: [ { model: TrolleyStatus, as: 'status', attributes: ['name'] }, { model: Location, as: 'location', attributes: ['name'] } ] });
    if (!trolley) {
      return res.status(404).json({ status: false, message: 'Troli tidak ditemukan' });
    }
    return res.json({
      status: true,
      message: 'Success',
      data: {
        trolley_id: trolley.id,
        rfid_code: trolley.rfid_code,
        current_location: trolley.location ? trolley.location.name : null,
        last_detected: trolley.updated_at || trolley.created_at,
        status: trolley.status ? trolley.status.name : null
      }
    });
  } catch (err) {
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};
