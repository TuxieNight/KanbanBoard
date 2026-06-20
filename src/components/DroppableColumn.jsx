import { useDroppable } from '@dnd-kit/core';

// A droppable area representing a single status column.
export default function DroppableColumn({ id, children }) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minWidth: 0,
      }}
    >
      {children}
    </div>
  );
}