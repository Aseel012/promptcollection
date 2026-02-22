export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
    PROMPTS: `${API_BASE_URL}/api/prompts`,
    CATEGORIES: `${API_BASE_URL}/api/categories`,
    ENGINES: `${API_BASE_URL}/api/engines`,
    HEALTH: `${API_BASE_URL}/api/health`,
};
