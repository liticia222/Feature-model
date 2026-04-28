import { useDraggable } from "@dnd-kit/react";

function Draggable({id, label}) {
  const { ref } = useDraggable({
    id
  });

  return (
    <div ref={ref} className="mb-4 mr-4 p-4 bg-gray-200 rounded">
      <p>{label ?? "Draggable"}</p>
    </div>

  );
}

export default Draggable;