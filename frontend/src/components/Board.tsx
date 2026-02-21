import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Task } from "./Task";
import type { ITask } from "../interface/interface";
import { Button } from "antd";
import { connectToWebSocket, disconnectFromWebSocket, getTasks } from "../api";
import { AddTask } from "./AddTask";

export const Board = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const username = (location.state as { username?: string } | null)?.username ?? sessionStorage.getItem("userName") ?? "";
    const [tasks, setTasks] = useState<ITask[]>([]);
    const [isAddTaskModalOpen, setAddTaskModalOpen] = useState(false)
    const socketRef = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    const connectWebSocket = async () => {
        if (!username) return;
        const ws = await connectToWebSocket(username, navigate);
        socketRef.current = ws;

        ws.onopen = () => {
            setIsConnected(true);
            getTasks().then(setTasks).catch(() => { console.log("Error getting data");});
        };
        ws.onclose = () => setIsConnected(false);
        ws.onmessage = (event) => {
            console.log(event, 'message')
            try {
                const data = JSON.parse(event.data);
                console.log(data, 'data')
                if (data.type === "users_list") return;
                if (data.type === "task_created" && data.task) {
                    setTasks((prev) => [...prev, data.task]);
                    return;
                }
                else if (data.type === "task_updated" && data.task) {
                    setTasks((prev) => [...prev.map((t) => (t.id === data.task.id ? data.task : t))]);
                    return;
                }
                 else if (data.type === "task_removed" && data.task_id) {
                    setTasks((prev) => [...prev.filter(t => t.id !== data.task_id)]);
                    return;
                }
        
            } catch {
                console.log("Error parsing message");
            }
        };
    };

    const getTasksList = async() => {
        try {
            const tasks = await getTasks();
            setTasks(tasks);
        } catch (error) {
            console.error("Failed to fetch tasks:", error instanceof Error ? error.message : error);
        }
    }

    useEffect(() => {
        getTasksList();
        connectWebSocket();
        return () => {
            if (socketRef.current) {
                disconnectFromWebSocket(socketRef.current);
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

                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gridGap: "15px" }}>
                    {isConnected && tasks.map((task) => (
                        <Task key={task.id} task={task} taskMode="view" socket={socketRef}/>
                    ))}
                </div>
                {!isConnected && <p>Connecting to server...</p>}
            </div>
        </div>
    );
};