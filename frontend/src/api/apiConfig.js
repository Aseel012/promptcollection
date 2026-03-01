// InsForge PostgREST API Configuration
const INSFORGE_BASE_URL = import.meta.env.VITE_INSFORGE_URL || 'https://6sbeyxbq.us-east.insforge.app';
const INSFORGE_ANON_KEY = import.meta.env.VITE_INSFORGE_ANON_KEY || '';

const defaultHeaders = {
    'Authorization': `Bearer ${INSFORGE_ANON_KEY}`,
    'Content-Type': 'application/json',
};

// Retry wrapper for transient 503 errors (cold start)
async function fetchWithRetry(url, options = {}, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url, options);
            if (res.status === 503 || res.status === 500) {
                console.warn(`Retry ${i + 1}/${retries} for ${url.split('?')[0]}...`);
                await new Promise(r => setTimeout(r, 1500 * (i + 1))); // wait 1.5s, 3s, 4.5s
                continue;
            }
            return res;
        } catch (err) {
            if (i === retries - 1) throw err;
            await new Promise(r => setTimeout(r, 1500 * (i + 1)));
        }
    }
    throw new Error('Max retries reached');
}

// ─── Mappers ─────────────────────────────────────────────────

function mapPrompt(row) {
    return {
        id: row.id, _id: row.id,
        userId: row.user_id,
        title: row.title,
        description: row.description,
        promptText: row.prompt_text, prompt_text: row.prompt_text,
        tags: row.tags || [],
        category: row.category,
        aiModel: row.ai_model, ai_model: row.ai_model,
        image: row.image,
        createdAt: row.created_at, created_at: row.created_at,
        updatedAt: row.updated_at,
    };
}

function mapCategory(row) {
    return {
        id: row.id, _id: row.id,
        name: row.name,
        image: row.image,
        description: row.description,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function mapEngine(row) {
    return {
        id: row.id, _id: row.id,
        name: row.name,
        icon: row.icon,
        description: row.description,
        website: row.website,
        isActive: row.is_active !== false,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// ─── Read Functions ──────────────────────────────────────────

export async function fetchPrompts({ pageNumber = 1, pageSize = 20, keyword, category, aiModel, ids, shuffle } = {}) {
    let url = `${INSFORGE_BASE_URL}/api/database/records/prompts?limit=${pageSize}&offset=${(pageNumber - 1) * pageSize}`;

    if (category && category !== 'All') url += `&category=eq.${encodeURIComponent(category)}`;
    if (aiModel && aiModel !== 'All') url += `&ai_model=eq.${encodeURIComponent(aiModel)}`;
    if (keyword) url += `&title=ilike.*${encodeURIComponent(keyword)}*`;
    if (ids && ids.length > 0) url += `&id=in.(${ids.join(',')})`;
    if (!shuffle) url += `&order=created_at.desc`;

    try {
        const res = await fetchWithRetry(url, { headers: defaultHeaders });
        if (!res.ok) {
            const txt = await res.text();
            console.error('fetchPrompts failed:', res.status, txt);
            return { prompts: [], page: pageNumber, pages: 1, count: 0 };
        }
        const data = await res.json();
        let prompts = Array.isArray(data) ? data.map(mapPrompt) : [];
        if (shuffle) prompts = shuffleArray(prompts);
        return {
            prompts,
            page: pageNumber,
            pages: Math.max(1, Math.ceil(prompts.length / pageSize)),
            count: prompts.length,
        };
    } catch (error) {
        console.error('fetchPrompts error:', error);
        return { prompts: [], page: pageNumber, pages: 1, count: 0 };
    }
}

export async function fetchPromptById(id) {
    try {
        const res = await fetchWithRetry(
            `${INSFORGE_BASE_URL}/api/database/records/prompts?id=eq.${id}`,
            { headers: defaultHeaders }
        );
        if (!res.ok) return null;
        const data = await res.json();
        return Array.isArray(data) && data.length > 0 ? mapPrompt(data[0]) : null;
    } catch (error) {
        console.error('fetchPromptById error:', error);
        return null;
    }
}

export async function fetchCategories() {
    try {
        const res = await fetchWithRetry(
            `${INSFORGE_BASE_URL}/api/database/records/categories?order=name.asc&limit=100`,
            { headers: defaultHeaders }
        );
        if (!res.ok) {
            console.error('fetchCategories failed:', res.status);
            return [];
        }
        const data = await res.json();
        return Array.isArray(data) ? data.map(mapCategory) : [];
    } catch (error) {
        console.error('fetchCategories error:', error);
        return [];
    }
}

export async function fetchEngines() {
    try {
        const res = await fetchWithRetry(
            `${INSFORGE_BASE_URL}/api/database/records/engines?order=name.asc&limit=100`,
            { headers: defaultHeaders }
        );
        if (!res.ok) {
            console.error('fetchEngines failed:', res.status);
            return [];
        }
        const data = await res.json();
        return Array.isArray(data) ? data.map(mapEngine) : [];
    } catch (error) {
        console.error('fetchEngines error:', error);
        return [];
    }
}

// ─── Write Functions (Admin CRUD) ────────────────────────────

function toSnakePrompt(data) {
    const mapped = {};
    if (data.title !== undefined) mapped.title = data.title;
    if (data.description !== undefined) mapped.description = data.description;
    if (data.promptText !== undefined) mapped.prompt_text = data.promptText;
    if (data.tags !== undefined) mapped.tags = Array.isArray(data.tags) ? data.tags : [];
    if (data.category !== undefined) mapped.category = data.category;
    if (data.aiModel !== undefined) mapped.ai_model = data.aiModel;
    if (data.image !== undefined) mapped.image = data.image;
    if (data.userId !== undefined) mapped.user_id = data.userId;
    return mapped;
}

export async function createPrompt(data) {
    const body = toSnakePrompt(data);
    const res = await fetchWithRetry(
        `${INSFORGE_BASE_URL}/api/database/records/prompts`,
        {
            method: 'POST',
            headers: { ...defaultHeaders, 'Prefer': 'return=representation' },
            body: JSON.stringify([body]),
        }
    );
    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Create prompt failed (${res.status}): ${errText}`);
    }
    const result = await res.json();
    return Array.isArray(result) && result.length > 0 ? mapPrompt(result[0]) : null;
}

export async function updatePrompt(id, data) {
    const body = toSnakePrompt(data);
    const res = await fetchWithRetry(
        `${INSFORGE_BASE_URL}/api/database/records/prompts?id=eq.${id}`,
        {
            method: 'PATCH',
            headers: { ...defaultHeaders, 'Prefer': 'return=representation' },
            body: JSON.stringify(body),
        }
    );
    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Update prompt failed (${res.status}): ${errText}`);
    }
    const result = await res.json();
    return Array.isArray(result) && result.length > 0 ? mapPrompt(result[0]) : null;
}

export async function deletePrompt(id) {
    const res = await fetchWithRetry(
        `${INSFORGE_BASE_URL}/api/database/records/prompts?id=eq.${id}`,
        { method: 'DELETE', headers: defaultHeaders }
    );
    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Delete prompt failed (${res.status}): ${errText}`);
    }
}

export async function createCategory(data) {
    const body = { name: data.name, image: data.image || null, description: data.description || null };
    const res = await fetchWithRetry(
        `${INSFORGE_BASE_URL}/api/database/records/categories`,
        {
            method: 'POST',
            headers: { ...defaultHeaders, 'Prefer': 'return=representation' },
            body: JSON.stringify([body]),
        }
    );
    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Create category failed (${res.status}): ${errText}`);
    }
    const result = await res.json();
    return Array.isArray(result) && result.length > 0 ? mapCategory(result[0]) : null;
}

export async function deleteCategory(id) {
    const res = await fetchWithRetry(
        `${INSFORGE_BASE_URL}/api/database/records/categories?id=eq.${id}`,
        { method: 'DELETE', headers: defaultHeaders }
    );
    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Delete category failed (${res.status}): ${errText}`);
    }
}

export async function createEngine(data) {
    const body = {
        name: data.name, icon: data.icon || null,
        description: data.description || null, website: data.website || null,
        is_active: data.isActive !== false,
    };
    const res = await fetchWithRetry(
        `${INSFORGE_BASE_URL}/api/database/records/engines`,
        {
            method: 'POST',
            headers: { ...defaultHeaders, 'Prefer': 'return=representation' },
            body: JSON.stringify([body]),
        }
    );
    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Create engine failed (${res.status}): ${errText}`);
    }
    const result = await res.json();
    return Array.isArray(result) && result.length > 0 ? mapEngine(result[0]) : null;
}

export async function updateEngine(id, data) {
    const body = {
        name: data.name, icon: data.icon || null,
        description: data.description || null, website: data.website || null,
        is_active: data.isActive !== false,
    };
    const res = await fetchWithRetry(
        `${INSFORGE_BASE_URL}/api/database/records/engines?id=eq.${id}`,
        {
            method: 'PATCH',
            headers: { ...defaultHeaders, 'Prefer': 'return=representation' },
            body: JSON.stringify(body),
        }
    );
    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Update engine failed (${res.status}): ${errText}`);
    }
    const result = await res.json();
    return Array.isArray(result) && result.length > 0 ? mapEngine(result[0]) : null;
}

export async function deleteEngine(id) {
    const res = await fetchWithRetry(
        `${INSFORGE_BASE_URL}/api/database/records/engines?id=eq.${id}`,
        { method: 'DELETE', headers: defaultHeaders }
    );
    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Delete engine failed (${res.status}): ${errText}`);
    }
}

// Legacy compat
export const API_BASE_URL = INSFORGE_BASE_URL;
export const API_ENDPOINTS = {
    PROMPTS: `${INSFORGE_BASE_URL}/api/database/records/prompts`,
    CATEGORIES: `${INSFORGE_BASE_URL}/api/database/records/categories`,
    ENGINES: `${INSFORGE_BASE_URL}/api/database/records/engines`,
};
export const INSFORGE_HEADERS = defaultHeaders;
