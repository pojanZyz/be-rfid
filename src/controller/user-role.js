import getUserModel from '../models/user.js';
import getRoleModel from '../models/role.js';
import { db } from '../config/database.js';
import { v4 as uuidv4, validate as validateUUID } from 'uuid';

const User = getUserModel(db);
const Role = getRoleModel(db);

export const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role_id } = req.body;
        const requester = req.user; // diasumsikan sudah diisi oleh middleware isAuth

        // Validasi UUID
        if (!validateUUID(role_id)) {
            return res.status(400).json({
                status: 'error',
                message: 'role_id harus berupa UUID yang valid',
                error: 400
            });
        }
        // Tidak boleh downgrade diri sendiri dari admin ke non-admin
        if (requester.id === id) {
            const role = await Role.findByPk(role_id);
            if (!role || role.name.toLowerCase() !== 'admin') {
                return res.status(401).json({
                    status: 'error',
                    message: 'User tidak dapat mengubah role sendiri menjadi non-admin',
                    error: 401
                });
            }
        }
        // Cek user
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User dengan ID tersebut tidak ditemukan',
                error: 404
            });
        }
        // Cek role
        const role = await Role.findByPk(role_id);
        if (!role) {
            return res.status(400).json({
                status: 'error',
                message: 'role_id harus berupa UUID yang valid',
                error: 400
            });
        }
        // Update role
        await user.update({ role_id });
        // (Opsional) Catat log perubahan role ke DB/Redis
        // Emit ke WebSocket jika perlu
        req.app.get('io').emit('user_role_update', {
            id: user.id,
            username: user.username,
            role_id,
            new_role: role.name
        });
        return res.status(200).json({
            status: true,
            message: 'Role user berhasil diperbarui',
            data: {
                id: user.id,
                username: user.username,
                role_id,
                new_role: role.name
            }
        });
    } catch (err) {
        return res.status(500).json({
            status: 'error',
            message: 'Gagal memperbarui role user',
            error: 500
        });
    }
};
