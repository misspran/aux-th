import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Task } from "./Task";
import type { ITask } from "../interface/interface";
import { Button } from "antd";
import {  getTasks } from "../api";
import { AddTask } from "./AddTask";
import { wsUrl } from "../constants";

export const Board = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const username = (location.state as { username?: string } | null)?.username ?? sessionStorage.getItem("userName") ?? "";
    const [tasks, setTasks] = useState<ITask[]>([]);
    const [isAddTaskModalOpen, setAddTaskModalOpen] = useState(false)
    const socketRef = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    const getTasksList = async () => {
        try {
            const list = await getTasks();
            setTasks(list);
        } catch (error) {
            console.error("Failed to fetch tasks:", error instanceof Error ? error.message : error);
        }
    };

    const connectWebSocket = async () => {
      // Connect via websockets listen to message streams
      try {
        if (!username) return;
        const ws = new WebSocket(wsUrl(`/ws/${encodeURIComponent(username)}`));
        socketRef.current = ws;

        socketRef.current.onopen = () => {
            setIsConnected(true);
            getTasksList();
        };
        socketRef.current.onclose = () => setIsConnected(false);
     
        socketRef.current.onmessage = (event) => {
    
            try {
                const data = JSON.parse(event.data);
            
                if (data.type === "task_created" && data.task) {
                    setTasks((prev) => [...prev, data.task]);
                    return;
                }
                if (data.type === "task_updated" && data.task) {
                    setTasks((prev) => [...prev.map((t) => (t.id === data.task.id ? data.task: t))]);
                    return;
                }
                if (data.type === "task_removed" && data.task_id != null) {
                    setTasks((prev) => prev.filter((t) => t.id !== data.task_id));
                    return;
                }
            } catch {
                console.log("Error parsing message");
            }
        };
    } catch (error) {
        navigate("/login")
        throw new Error(error instanceof Error ? error.message : "Failed to connect to WebSocket");
    }

    };

    useEffect(() => {
        getTasksList();
        connectWebSocket();
        return () => {
            if (socketRef.current) {
              // important to close connection and prevent memory leaks
                socketRef.current.close();
            }
            socketRef.current = null;
        };
    }, []);

    const logout = () => {
        socketRef.current?.close();
        setIsConnected(false);
        sessionStorage.removeItem('userName');
        sessionStorage.removeItem('userid');
        window.location.href = '/';
    }


    return (
        <div style={{width: '98vw', height: '100vh'}}>
            <div style={{borderBottom: '1px solid black', justifyContent: 'space-between', display: 'flex', alignItems: 'center', padding: '10px 20px', height: '60px'}}>
                <h2>Hi {username}, Welcome to the Task Board</h2>
                <div style={{display: 'flex', gap: '20px', alignItems: 'center'}}>
                 {isConnected && (
                    <AddTask showModal={() => setAddTaskModalOpen(true)} isModalOpen={isAddTaskModalOpen} socket={socketRef} handleCancel={() => setAddTaskModalOpen(false)} />
                )}
                <Button onClick={logout}>Logout</Button>
                </div>

            </div>
            <div style={{ padding: "15px"}}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gridGap: "15px", gridAutoFlow: 'row' }}>
                    {isConnected && tasks.map((task) => (
                        <Task key={task.id} task={task} taskMode="view" socket={socketRef}/>
                    ))}
                </div>
                {!isConnected && <p>Connecting to server...</p>}
            </div>
        </div>
    );
};