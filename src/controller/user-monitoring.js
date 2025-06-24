import Redis from 'ioredis';
const redis = new Redis();

// Helper untuk ambil data user aktif dan statistik akses troli dari Redis
async function getMonitoringData() {
    // Ambil daftar user aktif (misal: key redis 'active_users' tipe set atau list)
    const userIds = await redis.smembers('active_users');
    const active_users = [];
    for (const id of userIds) {
        const userData = await redis.hgetall(`user:${id}`); // hash: id, username, fullname, last_login, last_activity
        if (userData && userData.id) {
            active_users.push({
                id: userData.id,
                username: userData.username,
                fullname: userData.fullname,
                last_login: userData.last_login,
                last_activity: userData.last_activity
            });
        }
    }
    // Statistik akses troli
    const today = parseInt(await redis.get('trolley_access:today') || '0', 10);
    const this_week = parseInt(await redis.get('trolley_access:this_week') || '0', 10);
    const top_users = JSON.parse(await redis.get('trolley_access:top_users') || '[]');
    return {
        active_users,
        trolley_access_stats: {
            today,
            this_week,
            top_users
        }
    };
}

export const getUserMonitoring = async (req, res) => {
    try {
        // Pastikan user admin (role dicek di middleware)
        const data = await getMonitoringData();
        // Emit ke WebSocket (broadcast ke semua client)
        req.app.get('io').emit('user_monitoring_update', data);
        return res.status(200).json({
            status: true,
            message: 'Success',
            data
        });
    } catch (err) {
        return res.status(500).json({
            status: 'error',
            message: 'Gagal mengambil data monitoring',
            error: 500
        });
    }
};
