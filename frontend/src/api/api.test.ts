import { describe, it, expect, vi, beforeEach } from "vitest";
import { BACKEND_URL } from "../constants";
import { login, getTasks, addTask, editTask, removeTask } from "./index";

describe("login", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("sends POST with username and returns user", async () => {
    const mockUser = { id: 1, username: "alice" };
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockUser),
    });

    const user = await login("alice");
    expect(user).toEqual(mockUser);
    expect(fetch).toHaveBeenCalledWith(
      `${BACKEND_URL}/login`,
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "alice" }),
      })
    );
  });

  it("throws on non-ok response with error message", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      statusText: "Server Error",
      json: () => Promise.resolve({ error: "User exists" }),
    });

    await expect(login("bob")).rejects.toThrow("User exists");
  });
});

describe("getTasks", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("returns tasks array from response", async () => {
    const mockTasks = [
      { id: 1, title: "T1", description: "D1", status: "todo" },
    ];
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTasks),
    });

    const tasks = await getTasks();
    expect(tasks).toEqual(mockTasks);
    expect(fetch).toHaveBeenCalledWith(`${BACKEND_URL}/tasks`);
  });

  it("returns empty array when response is null/undefined", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(undefined),
    });
    const tasks = await getTasks();
    expect(tasks).toEqual([]);
  });

  it("throws on non-ok response", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });
    await expect(getTasks()).rejects.toThrow("Failed to fetch tasks");
  });
});

describe("addTask", () => {
  it("sends add_task message when socket is OPEN", () => {
    const send = vi.fn();
    const ws = {
      readyState: 1,
      send,
    } as unknown as WebSocket;

    addTask(ws, { title: "New", description: "Desc", status: "todo" }, "add_task");
    expect(send).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(send.mock.calls[0][0]);
    expect(payload).toMatchObject({
      type: "add_task",
      title: "New",
      description: "Desc",
      status: "todo",
    });
  });

  it("does nothing when socket is null", () => {
    addTask(null, { title: "X", description: "", status: "todo" }, "add_task");
    // no throw, no call
  });

  it("does nothing when socket is not OPEN", () => {
    const send = vi.fn();
    const ws = { readyState: 0, send } as unknown as WebSocket;
    addTask(ws, { title: "X", description: "", status: "todo" }, "add_task");
    expect(send).not.toHaveBeenCalled();
  });
});

describe("editTask", () => {
  it("sends edit_task message with task id and fields", () => {
    const send = vi.fn();
    const ws = { readyState: 1, send } as unknown as WebSocket;
    editTask(
      ws,
      { id: 2, title: "Edited", description: "D", status: "done" },
      "edit_task"
    );
    expect(send).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(send.mock.calls[0][0]);
    expect(payload).toMatchObject({
      type: "edit_task",
      id: 2,
      title: "Edited",
      status: "done",
    });
  });
});

describe("removeTask", () => {
  it("sends remove_task message with task_id", () => {
    const send = vi.fn();
    const ws = { readyState: 1, send } as unknown as WebSocket;
    removeTask(ws, 3, "remove_task");
    expect(send).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(send.mock.calls[0][0]);
    expect(payload).toEqual({ type: "remove_task", id: 3 });
  });
});
