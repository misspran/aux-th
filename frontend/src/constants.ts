export const BACKEND_URL = "http://localhost:8000/api";

export const wsUrl = (path: string) => BACKEND_URL.replace(/^http/, 'ws') + path;