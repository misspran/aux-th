import type { NavigateFunction } from "react-router-dom";
import { BACKEND_URL } from "../constants";
import type { User, ITask, IAddTask } from "../interface/interface";

const wsUrl = (path: string) => BACKEND_URL.replace(/^http/, "ws") + path;

export async function login(username: string): Promise<User> {
  const res = await fetch(`${BACKEND_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "Login failed");
  }
  return res.json();
}

export async function connectToWebSocket(username: string, navigate: NavigateFunction): Promise<WebSocket> {
    try {
        const ws = new WebSocket(wsUrl(`/ws/${encodeURIComponent(username)}`));
        return ws;
    } catch (error) {
        navigate("/login")
        throw new Error(error instanceof Error ? error.message : "Failed to connect to WebSocket");
    }
}

export function disconnectFromWebSocket(ws: WebSocket): void {
    try {
        ws.close();
    } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to disconnect from WebSocket");
    }
}

export async function getTasks(): Promise<ITask[]> {
  const res = await fetch(`${BACKEND_URL}/tasks`);
  if (!res.ok) throw new Error("Failed to fetch tasks");
  const data = await res.json();
  return data ?? [];
}

export function addTask(
  ws: WebSocket | null,
  task: IAddTask,
  type: "add_task"
): void {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  return ws.send(
    JSON.stringify({
      type: type,
      title: task.title,
      description: task.description,
      status: task.status ?? "todo",
    })
  );
}

export function editTask(
  ws: WebSocket | null,
  task: ITask,
  type: "edit_task",
): void {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  return ws.send(
    JSON.stringify({
      type: type,
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status ?? "todo",
    })
  );
}

export function removeTask(
  ws: WebSocket | null,
  task_id: string | number,
  type: "remove_task"
): void {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  return ws.send(
    JSON.stringify({
      type: type,
      id: task_id,
    })
  );
}



