const { pool } = require('../config/db');

const Engine = {
    find: async () => {
        const { rows } = await pool.query('SELECT * FROM engines ORDER BY name ASC');
        return rows.map(r => ({ ...r, _id: r.id }));
    },

    findById: async (id) => {
        const { rows } = await pool.query('SELECT * FROM engines WHERE id = $1', [id]);
        if (rows.length === 0) return null;
        const r = rows[0];
        return {
            ...r,
            _id: r.id,
            isActive: r.is_active,
            deleteOne: async function () {
                await pool.query('DELETE FROM engines WHERE id = $1', [this.id]);
            },
            save: async function () {
                const fields = ['name', 'description', 'website', 'icon', 'is_active'];
                const values = [this.name, this.description, this.website, this.icon, this.isActive];
                const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
                const { rows: updateRows } = await pool.query(
                    `UPDATE engines SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
                    [this.id, ...values]
                );
                const ur = updateRows[0];
                return { ...ur, _id: ur.id, isActive: ur.is_active };
            }
        };
    },

    findOne: async ({ name }) => {
        const { rows } = await pool.query('SELECT * FROM engines WHERE name = $1', [name]);
        if (rows.length === 0) return null;
        return { ...rows[0], _id: rows[0].id, isActive: rows[0].is_active };
    },

    create: async ({ name, description, website, icon, isActive }) => {
        const { rows } = await pool.query(
            'INSERT INTO engines (name, description, website, icon, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, description, website, icon, isActive !== undefined ? isActive : true]
        );
        return { ...rows[0], _id: rows[0].id, isActive: rows[0].is_active };
    },

    findByIdAndDelete: async (id) => {
        const { rows } = await pool.query('DELETE FROM engines WHERE id = $1 RETURNING *', [id]);
        if (rows.length === 0) return null;
        return { ...rows[0], _id: rows[0].id };
    },

    findByIdAndUpdate: async (id, update, options) => {
        const fields = Object.keys(update);
        const values = Object.values(update);
        // Map isActive to is_active for SQL
        const sqlFields = fields.map(f => f === 'isActive' ? 'is_active' : f);
        const setClause = sqlFields.map((f, i) => `${f} = $${i + 2}`).join(', ');
        const { rows } = await pool.query(
            `UPDATE engines SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
            [id, ...values]
        );
        if (rows.length === 0) return null;
        return { ...rows[0], _id: rows[0].id, isActive: rows[0].is_active };
    }
};

module.exports = Engine;

