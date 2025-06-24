import getLocationModel from '../models/location.js';
import { db } from '../config/database.js';

const Location = getLocationModel(db);

export const getLocations = async (req, res) => {
    try {
        let { search } = req.query;
        if (search && typeof search !== 'string') {
            return res.status(400).json({
                status: 'error',
                message: "Parameter 'search' harus berupa string",
                error: 400
            });
        }
        let where = { deleted_at: null };
        if (search) {
            where.name = { $like: `%${search}%` };
        }
        const locations = await Location.findAll({ where });
        const data = locations.map(loc => ({
            id: loc.id,
            name: loc.name,
            description: loc.description,
            x_coordinate: loc.x_coordinate,
            y_coordinate: loc.y_coordinate,
            z_coordinate: loc.z_coordinate
        }));
        return res.status(200).json({
            status: true,
            message: 'Success',
            data
        });
    } catch (err) {
        return res.status(500).json({
            status: 'error',
            message: 'Gagal mengambil data lokasi',
            error: 500
        });
    }
};
