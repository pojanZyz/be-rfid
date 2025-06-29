import db from '../models/index.js';
const { RFIDReader, Location } = db;

// GET /readers
export const getRFIDReaders = async (req, res) => {
  try {
    const redis = req.app.get('redis');
    const readers = await RFIDReader.findAll({
      include: [{ model: Location, as: 'location', attributes: ['name'] }]
    });
    const data = await Promise.all(readers.map(async reader => {
      // Ambil status dari Redis jika ada
      let cache = await redis.get(`rfid:reader:${reader.id}`);
      let status = reader.status;
      let last_online = reader.last_online;
      if (cache) {
        try {
          const parsed = JSON.parse(cache);
          status = parsed.status || status;
          last_online = parsed.last_online || last_online;
        } catch {}
      }
      return {
        id: reader.id,
        device_code: reader.device_code,
        location: reader.location ? reader.location.name : null,
        ip_address: reader.ip_address,
        status,
        last_online
      };
    }));
    return res.json({ status: true, message: 'Success', data });
  } catch (err) {
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

// PATCH /readers/:id
export const updateRFIDReader = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, location_id } = req.body;
    const reader = await RFIDReader.findByPk(id);
    if (!reader) {
      return res.status(404).json({ status: false, message: 'Reader not found' });
    }
    if (status) reader.status = status;
    if (location_id) reader.location_id = location_id;
    if (status) reader.last_online = new Date();
    await reader.save();
    // Update Redis
    const redis = req.app.get('redis');
    await redis.set(`rfid:reader:${reader.id}`, JSON.stringify({ status: reader.status, last_online: reader.last_online }));
    // Push ke frontend via WebSocket
    const io = req.app.get('io');
    io.emit('rfid:reader:update', {
      id: reader.id,
      device_code: reader.device_code,
      status: reader.status,
      location_id: reader.location_id
    });
    return res.json({
      status: true,
      message: 'Reader updated successfully',
      data: {
        id: reader.id,
        device_code: reader.device_code,
        status: reader.status,
        location_id: reader.location_id
      }
    });
  } catch (err) {
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};
