import { Button, Input, Select } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useEffect, useState, type RefObject } from 'react';
import {editTask, addTask, removeTask} from '../api';
import type { ITask } from '../interface/interface';
import { task_type_add, task_type_edit, task_type_remove } from '../constants';
import { emptyTask } from './AddTask';
const { Option } = Select;
const { TextArea } = Input;

export interface ITaskProps {
    task: ITask;
    taskMode: "view" | "edit" | "create" | "delete";
    socket: RefObject<WebSocket | null>;
    handleClose?: () => void;
}
export const Task = ({ task, taskMode, socket, handleClose }: ITaskProps) => {

    const [taskModeState, setTaskModeState] = useState(taskMode);
    const [taskState, setTaskState] = useState(task);
    const onAddTask = () => {
        if(!socket || taskModeState === "view") return;
        addTask(socket.current, taskState, task_type_add);
        if(taskModeState === "create" && handleClose){ 
            setTaskState(emptyTask)
            handleClose()
        };
       
    };

    const onEditTask = () => {
        if(!socket || taskModeState === "view") return;
        editTask(socket.current, taskState, task_type_edit);
        setTaskModeState("view")
    };

    const onDeleteTask = () => {
        if(!socket) return;
        removeTask(socket.current, taskState.id, task_type_remove);
    }; 

    const editDetailsTask = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setTaskState(prevTask => ({
            ...prevTask,
            [name]: value
        }));
    };
    // Update task
    useEffect(() => {
        setTaskState(task)
    }, [task])

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px', border: '1px solid #ccc', borderRadius: '8px' }}>
            <Input disabled={taskModeState === "view"} type="text" name="title" value={taskState.title} onChange={editDetailsTask} placeholder="Title" />
            <TextArea disabled={taskModeState === "view"} name="description" value={taskState.description} onChange={editDetailsTask} placeholder="Description" rows={4} />
            <Select disabled={taskModeState === "view"} value={taskState.status} onChange={(value) => setTaskState(prevTask => ({ ...prevTask, status: value }))} placeholder="Select Status" defaultValue={"todo"}>
                <Option value="">Select Status</Option>
                <Option value="todo">To Do</Option>
                <Option value="in progress">In Progress</Option>
                <Option value="done">Done</Option>
            </Select>
            <div style={{display:'grid', gridTemplateColumns: '1fr 1fr', gridGap: '10px'}}>
            {taskModeState === "view" &&<Button onClick={() => setTaskModeState("edit")}><EditOutlined /></Button>}
            {taskModeState !== "view" && <Button onClick={taskModeState === "create" ? onAddTask : onEditTask} style={{ borderColor: 'purple', color: 'purple' }}>{taskModeState === "create" ? "Create Task" : "Edit Task"}</Button>}
            <Button onClick={onDeleteTask}><DeleteOutlined /></Button>
            </div>
        </div>
    );
};