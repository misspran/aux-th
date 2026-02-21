import { Button, Input, Select } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useState, type RefObject } from 'react';
import { addEditTask } from '../api';
import type { ITask } from '../interface/interface';
const { Option } = Select;
const { TextArea } = Input;

export interface ITaskProps {
    task: ITask;
    taskMode: "view" | "edit" | "create" | "delete";
    socket?: RefObject<WebSocket | null>;
    handleClose?: () => void;
}
export const Task = ({ task, taskMode, socket, handleClose }: ITaskProps) => {
    const [taskModeState, setTaskModeState] = useState(taskMode);
    const [taskState, setTaskState] = useState(task);

    const onAddEditTask = () => {
        if(!socket || taskModeState === "view") return;
        const task_type = taskModeState === "create" ? "add_task" : "edit_task";
        console.log(task_type)
        addEditTask(socket.current, taskState, task_type);
        if(taskModeState === "create" && handleClose) handleClose();
        // if(task.id){
        //     setTaskModeState("view");
        // }
        
    }; 
       const onDeleteTask = () => {
        if(!socket) return;
        const task_type = "remove_task";
        addEditTask(socket.current, taskState, task_type);
    }; 

    const editTask = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setTaskState(prevTask => ({
            ...prevTask,
            [name]: value
        }));
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px', border: '1px solid #ccc', borderRadius: '8px' }}>
            <Input disabled={taskModeState === "view"} type="text" name="title" value={taskState.title} onChange={editTask} placeholder="Title" />
            <TextArea disabled={taskModeState === "view"} name="description" value={taskState.description} onChange={editTask} placeholder="Description" rows={4} />
            <Select disabled={taskModeState === "view"} value={taskState.status} onChange={(value) => setTaskState(prevTask => ({ ...prevTask, status: value }))} placeholder="Select Status" defaultValue={"todo"}>
                <Option value="">Select Status</Option>
                <Option value="todo">To Do</Option>
                <Option value="in progress">In Progress</Option>
                <Option value="done">Done</Option>
            </Select>
            <div style={{display:'grid', gridTemplateColumns: '1fr 1fr', gridGap: '10px'}}>
            {taskModeState === "view" &&<Button onClick={() => setTaskModeState("edit")}><EditOutlined /></Button>}
            {taskModeState !== "view" && <Button onClick={onAddEditTask} style={{ borderColor: 'purple', color: 'purple' }}>{taskModeState === "create" ? "Create Task" : "Edit Task"}</Button>}
            {taskModeState === "view" &&<Button onClick={onDeleteTask}><DeleteOutlined /></Button>}
            </div>
        </div>
    );
};