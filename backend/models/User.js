const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

const User = {
    findOne: async ({ email }) => {
        const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (rows.length === 0) return null;

        const user = rows[0];
        // Normalize fields for controller compatibility
        return {
            ...user,
            _id: user.id,
            isAdmin: user.is_admin,
            matchPassword: async function (enteredPassword) {
                return await bcrypt.compare(enteredPassword, this.password);
            }
        };
    },

    findById: async (id) => {
        const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        if (rows.length === 0) return null;

        const user = rows[0];
        return {
            ...user,
            _id: user.id,
            isAdmin: user.is_admin
        };
    },

    create: async ({ name, email, password }) => {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const { rows } = await pool.query(
            'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *',
            [name, email, hashedPassword]
        );
        const user = rows[0];
        return {
            ...user,
            _id: user.id,
            isAdmin: user.is_admin
        };
    }
};

module.exports = User;

