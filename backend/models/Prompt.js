const { pool } = require('../config/db');

const Prompt = {
    countDocuments: async (keyword = {}) => {
        let query = 'SELECT COUNT(*) FROM prompts';
        const params = [];
        if (keyword.title && keyword.title.$regex) {
            query += ' WHERE title ILIKE $1';
            params.push(`%${keyword.title.$regex}%`);
        }
        const { rows } = await pool.query(query, params);
        return parseInt(rows[0].count);
    },

    find: async (keyword = {}, options = {}) => {
        let query = 'SELECT * FROM prompts';
        const params = [];
        let paramIndex = 1;

        if (keyword.title && keyword.title.$regex) {
            query += ` WHERE title ILIKE $${paramIndex++}`;
            params.push(`%${keyword.title.$regex}%`);
        } else if (keyword.category) {
            query += ` WHERE category = $${paramIndex++}`;
            params.push(keyword.category);
        }

        query += ' ORDER BY created_at DESC';

        if (options.limit) {
            query += ` LIMIT $${paramIndex++}`;
            params.push(options.limit);
        }
        if (options.skip) {
            query += ` OFFSET $${paramIndex++}`;
            params.push(options.skip);
        }

        const { rows } = await pool.query(query, params);
        return rows.map(r => ({
            ...r,
            _id: r.id,
            user: r.user_id,
            promptText: r.prompt_text,
            aiModel: r.ai_model,
            createdAt: r.created_at,
            updatedAt: r.updated_at
        }));
    },

    findById: async (id) => {
        const { rows } = await pool.query('SELECT * FROM prompts WHERE id = $1', [id]);
        if (rows.length === 0) return null;
        const r = rows[0];
        return {
            ...r,
            _id: r.id,
            user: r.user_id,
            promptText: r.prompt_text,
            aiModel: r.ai_model,
            deleteOne: async function () {
                await pool.query('DELETE FROM prompts WHERE id = $1', [this.id]);
            },
            save: async function () {
                const fields = ['title', 'description', 'prompt_text', 'tags', 'category', 'ai_model', 'image'];
                const values = [this.title, this.description, this.promptText, JSON.stringify(this.tags), this.category, this.aiModel, this.image];
                const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
                const { rows } = await pool.query(
                    `UPDATE prompts SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
                    [this.id, ...values]
                );
                return { ...rows[0], _id: rows[0].id };
            }
        };
    },

    create: async (data) => {
        const { rows } = await pool.query(
            `INSERT INTO prompts (user_id, title, description, prompt_text, tags, category, ai_model, image) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [
                data.user,
                data.title,
                data.description,
                data.promptText,
                JSON.stringify(data.tags || []),
                data.category,
                data.aiModel,
                data.image
            ]
        );
        const r = rows[0];
        return { ...r, _id: r.id, user: r.user_id, promptText: r.prompt_text, aiModel: r.ai_model };
    }
};

module.exports = Prompt;

