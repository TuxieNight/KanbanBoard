import { useDraggable } from '@dnd-kit/core';
import Task from './Task.jsx';

// Wraps a Task in a draggable container for use with dnd-kit.
export default function DraggableTask(props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
  } = useDraggable({ id: props.id });

  const style = {
    opacity: isDragging ? 0 : 1,
    cursor: 'grab',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Task {...props} />
    </div>
  );
}