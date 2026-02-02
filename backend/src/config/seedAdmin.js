const User = require('../models/User');

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin';

async function seedAdmin() {
  try {
    const existing = await User.findOne({ username: ADMIN_USERNAME });
    if (existing) return;

    await User.create({
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD,
      role: 'admin',
    });
    if (process.env.NODE_ENV !== 'test') {
      console.log('Admin user (admin/admin) created or already exists');
    }
  } catch (err) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Seed admin error:', err.message);
    }
  }
}

module.exports = seedAdmin;
