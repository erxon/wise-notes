import type { Note } from "@/lib/types";
import NoteText from "./note-text";
import NoteList from "./note-list";
import { ConnectableElement, useDrag, useDrop } from "react-dnd";
import { motion } from "motion/react";
import clsx from "clsx";

interface DragItem {
  id: string;
  index: number;
  type: string;
}

function DisplayNote({
  note,
  id,
  index,
  moveNote,
  setNotes,
}: {
  note: Note;
  id: string;
  index: number;
  moveNote: (id: string, toIndex: number) => void;
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
}) {
  const [{ isOver }, dropRef] = useDrop<DragItem>({
    accept: "note",
    drop: (item) => {
      const draggedIndex = item.index;
      const targetIndex = index;

      if (draggedIndex !== targetIndex) {
        moveNote(item.id, targetIndex);
        item.index = targetIndex;
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }) as [{ isOver: boolean }, (node: HTMLElement | null) => ConnectableElement];

  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: "note",
    item: { id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <>
      <motion.div
        ref={(node) => {
          dragRef(dropRef(node));
        }}
        layout
        initial={{ scale: 1 }}
        animate={{ scale: isOver ? 0.95 : 1 }}
        className={clsx(
          isOver && "opacity-20",
          `${isDragging ? "opacity-75" : "opacity-100"}`
        )}
      >
        {note.type === "text" && <NoteText setNotes={setNotes} note={note} />}
        {note.type === "list" && <NoteList note={note} />}{" "}
      </motion.div>
    </>
  );
}

export default function Notes({
  notes,
  setNotes,
}: {
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
}) {
  const moveNote = (id: string, toIndex: number) => {
    const index = notes.findIndex((note) => note._id === id);
    const updatedNotes = [...notes];
    const [movedNote] = updatedNotes.splice(index, 1);
    updatedNotes.splice(toIndex, 0, movedNote);
    setNotes(updatedNotes);
  };

  return (
    <div className="columns-2 md:columns-3 lg:columns-4 gap-2">
      {notes.map((note, index) => {
        if (!note.deletedAt) {
          return (
            <DisplayNote
              key={note._id}
              index={index}
              moveNote={moveNote}
              id={note._id}
              note={note}
              setNotes={setNotes}
            />
          );
        }
      })}
    </div>
  );
}
