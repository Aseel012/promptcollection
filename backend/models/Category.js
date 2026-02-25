const { pool } = require('../config/db');

const Category = {
    find: async () => {
        const { rows } = await pool.query('SELECT * FROM categories ORDER BY name ASC');
        return rows.map(r => ({ ...r, _id: r.id }));
    },

    findOne: async ({ name }) => {
        const { rows } = await pool.query('SELECT * FROM categories WHERE name = $1', [name]);
        if (rows.length === 0) return null;
        return { ...rows[0], _id: rows[0].id };
    },

    findById: async (id) => {
        const { rows } = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
        if (rows.length === 0) return null;
        const r = rows[0];
        return {
            ...r,
            _id: r.id,
            deleteOne: async function () {
                await pool.query('DELETE FROM categories WHERE id = $1', [this.id]);
            }
        };
    },

    create: async ({ name, image, description }) => {
        const { rows } = await pool.query(
            'INSERT INTO categories (name, image, description) VALUES ($1, $2, $3) RETURNING *',
            [name, image, description]
        );
        return { ...rows[0], _id: rows[0].id };
    },

    findByIdAndDelete: async (id) => {
        const { rows } = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING *', [id]);
        if (rows.length === 0) return null;
        return { ...rows[0], _id: rows[0].id };
    },

    findByIdAndUpdate: async (id, update, options) => {
        // Simple implementation for update
        const fields = Object.keys(update);
        const values = Object.values(update);
        const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
        const { rows } = await pool.query(
            `UPDATE categories SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
            [id, ...values]
        );
        if (rows.length === 0) return null;
        return { ...rows[0], _id: rows[0].id };
    }
};

module.exports = Category;

