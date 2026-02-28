// InsForge PostgREST API Configuration
const INSFORGE_BASE_URL = import.meta.env.VITE_INSFORGE_URL || 'https://6sbeyxbq.us-east.insforge.app';
const INSFORGE_ANON_KEY = import.meta.env.VITE_INSFORGE_ANON_KEY || '';

// Default headers for all InsForge API calls
const defaultHeaders = {
    'Authorization': `Bearer ${INSFORGE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
};

// Map snake_case DB fields to camelCase frontend fields
function mapPrompt(row) {
    return {
        _id: row.id,
        userId: row.user_id,
        title: row.title,
        description: row.description,
        promptText: row.prompt_text,
        tags: row.tags || [],
        category: row.category,
        aiModel: row.ai_model,
        image: row.image,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function mapCategory(row) {
    return {
        _id: row.id,
        name: row.name,
        image: row.image,
        description: row.description,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function mapEngine(row) {
    return {
        _id: row.id,
        name: row.name,
        icon: row.icon,
        description: row.description,
        website: row.website,
        isActive: row.is_active !== false,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

// Fisher-Yates shuffle
function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// ─── API Functions ───────────────────────────────────────────

export async function fetchPrompts({ pageNumber = 1, pageSize = 8, keyword, category, ids, shuffle } = {}) {
    let url = `${INSFORGE_BASE_URL}/api/database/records/prompts?limit=${pageSize}&offset=${(pageNumber - 1) * pageSize}`;

    if (category && category !== 'All') {
        url += `&category=eq.${encodeURIComponent(category)}`;
    }
    if (keyword) {
        url += `&title=ilike.*${encodeURIComponent(keyword)}*`;
    }
    if (ids && ids.length > 0) {
        url += `&id=in.(${ids.join(',')})`;
    }
    if (!shuffle) {
        url += `&order=created_at.desc`;
    }

    const res = await fetch(url, { headers: defaultHeaders });
    const totalCount = parseInt(res.headers.get('X-Total-Count') || '0', 10);
    const data = await res.json();

    let prompts = Array.isArray(data) ? data.map(mapPrompt) : [];

    if (shuffle) {
        prompts = shuffleArray(prompts);
    }

    return {
        prompts,
        page: pageNumber,
        pages: Math.ceil(totalCount / pageSize) || 1,
        count: totalCount || prompts.length,
    };
}

export async function fetchPromptById(id) {
    const res = await fetch(
        `${INSFORGE_BASE_URL}/api/database/records/prompts?id=eq.${id}`,
        { headers: defaultHeaders }
    );
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
        return mapPrompt(data[0]);
    }
    return null;
}

export async function fetchCategories({ includeImage = false } = {}) {
    const selectParam = includeImage ? '*' : 'id,name,description,created_at,updated_at';
    const res = await fetch(
        `${INSFORGE_BASE_URL}/api/database/records/categories?select=${selectParam}&order=name.asc&limit=100`,
        { headers: defaultHeaders }
    );
    const data = await res.json();
    return Array.isArray(data) ? data.map(mapCategory) : [];
}

export async function fetchEngines() {
    const res = await fetch(
        `${INSFORGE_BASE_URL}/api/database/records/engines?order=name.asc&limit=100`,
        { headers: defaultHeaders }
    );
    const data = await res.json();
    return Array.isArray(data) ? data.map(mapEngine) : [];
}

// ─── Admin CRUD ──────────────────────────────────────────────

// Map camelCase frontend fields back to snake_case for DB inserts/updates
function toSnakePrompt(data) {
    const mapped = {};
    if (data.title !== undefined) mapped.title = data.title;
    if (data.description !== undefined) mapped.description = data.description;
    if (data.promptText !== undefined) mapped.prompt_text = data.promptText;
    if (data.tags !== undefined) mapped.tags = data.tags;
    if (data.category !== undefined) mapped.category = data.category;
    if (data.aiModel !== undefined) mapped.ai_model = data.aiModel;
    if (data.image !== undefined) mapped.image = data.image;
    if (data.userId !== undefined) mapped.user_id = data.userId;
    return mapped;
}

export async function createPrompt(data, adminToken) {
    const body = toSnakePrompt(data);
    const res = await fetch(
        `${INSFORGE_BASE_URL}/api/database/records/prompts`,
        {
            method: 'POST',
            headers: {
                ...defaultHeaders,
                'Authorization': `Bearer ${adminToken || INSFORGE_ANON_KEY}`,
                'Prefer': 'return=representation',
            },
            body: JSON.stringify([body]),
        }
    );
    const result = await res.json();
    return Array.isArray(result) && result.length > 0 ? mapPrompt(result[0]) : null;
}

export async function updatePrompt(id, data, adminToken) {
    const body = toSnakePrompt(data);
    const res = await fetch(
        `${INSFORGE_BASE_URL}/api/database/records/prompts?id=eq.${id}`,
        {
            method: 'PATCH',
            headers: {
                ...defaultHeaders,
                'Authorization': `Bearer ${adminToken || INSFORGE_ANON_KEY}`,
                'Prefer': 'return=representation',
            },
            body: JSON.stringify(body),
        }
    );
    const result = await res.json();
    return Array.isArray(result) && result.length > 0 ? mapPrompt(result[0]) : null;
}

export async function deletePrompt(id, adminToken) {
    await fetch(
        `${INSFORGE_BASE_URL}/api/database/records/prompts?id=eq.${id}`,
        {
            method: 'DELETE',
            headers: {
                ...defaultHeaders,
                'Authorization': `Bearer ${adminToken || INSFORGE_ANON_KEY}`,
            },
        }
    );
}

export async function createCategory(data, adminToken) {
    const body = { name: data.name, image: data.image, description: data.description };
    const res = await fetch(
        `${INSFORGE_BASE_URL}/api/database/records/categories`,
        {
            method: 'POST',
            headers: {
                ...defaultHeaders,
                'Authorization': `Bearer ${adminToken || INSFORGE_ANON_KEY}`,
                'Prefer': 'return=representation',
            },
            body: JSON.stringify([body]),
        }
    );
    const result = await res.json();
    return Array.isArray(result) && result.length > 0 ? mapCategory(result[0]) : null;
}

export async function deleteCategory(id, adminToken) {
    await fetch(
        `${INSFORGE_BASE_URL}/api/database/records/categories?id=eq.${id}`,
        {
            method: 'DELETE',
            headers: {
                ...defaultHeaders,
                'Authorization': `Bearer ${adminToken || INSFORGE_ANON_KEY}`,
            },
        }
    );
}

export async function createEngine(data, adminToken) {
    const body = { name: data.name, icon: data.icon, description: data.description, website: data.website, is_active: data.isActive };
    const res = await fetch(
        `${INSFORGE_BASE_URL}/api/database/records/engines`,
        {
            method: 'POST',
            headers: {
                ...defaultHeaders,
                'Authorization': `Bearer ${adminToken || INSFORGE_ANON_KEY}`,
                'Prefer': 'return=representation',
            },
            body: JSON.stringify([body]),
        }
    );
    const result = await res.json();
    return Array.isArray(result) && result.length > 0 ? mapEngine(result[0]) : null;
}

export async function deleteEngine(id, adminToken) {
    await fetch(
        `${INSFORGE_BASE_URL}/api/database/records/engines?id=eq.${id}`,
        {
            method: 'DELETE',
            headers: {
                ...defaultHeaders,
                'Authorization': `Bearer ${adminToken || INSFORGE_ANON_KEY}`,
            },
        }
    );
}

// Legacy compatibility — keep old endpoints shape for any remaining references
export const API_BASE_URL = INSFORGE_BASE_URL;
export const API_ENDPOINTS = {
    PROMPTS: `${INSFORGE_BASE_URL}/api/database/records/prompts`,
    CATEGORIES: `${INSFORGE_BASE_URL}/api/database/records/categories`,
    ENGINES: `${INSFORGE_BASE_URL}/api/database/records/engines`,
    HEALTH: `${INSFORGE_BASE_URL}/api/health`,
};
export const INSFORGE_HEADERS = defaultHeaders;
