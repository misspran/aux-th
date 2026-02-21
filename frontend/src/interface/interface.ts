export interface ITask {
    id: number | string;
    title: string;
    description: string;
    status: string;
}

export interface IAddTask {
    title: string;
    description: string;
    status: string;
}

export interface ITaskResponse {
    id: string;
    title: string;
    description: string;
    status: string;
    created_at: string;
    updated_at: string;
}

export type User = { id: number; username: string };