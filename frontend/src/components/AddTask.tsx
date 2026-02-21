import { Task } from "./Task";
import { Button, Modal } from "antd";
import type { RefObject } from "react";


interface IAddTaskProps {
    showModal: () => void;
    isModalOpen: boolean;
    socket: RefObject<WebSocket | null>;
    handleCancel: () => void;
}

export const emptyTask = {
        id: "",
        title:  "",
        description: "",
        status: "",
    }

export const AddTask = ({showModal, isModalOpen, socket, handleCancel}: IAddTaskProps) => {
    return (
        <>
          <Button type="primary" onClick={showModal} style={{ backgroundColor: 'purple', borderColor: 'purple' }}>
            Add Task
          </Button>
          <Modal
            title="Basic Modal"
            closable={{ 'aria-label': 'Custom Close Button' }}
            open={isModalOpen}
            onCancel={handleCancel}
            okButtonProps={{ style: { display: 'none' } }}
          >
            <Task
                task={emptyTask}
                taskMode={"create"}
                socket={socket}
                handleClose={handleCancel}
            />
          </Modal>
        </>
      );
}