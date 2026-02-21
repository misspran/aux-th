export const BACKEND_URL = "http://localhost:8000/api";

export const wsUrl = (path: string) => BACKEND_URL.replace(/^http/, 'ws') + path;

export const task_type_add = "add_task";
export const task_type_edit = "edit_task";
export const task_type_remove = "remove_task";