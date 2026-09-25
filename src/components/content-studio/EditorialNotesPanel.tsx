export default function EditorialNotesPanel({
  noteBody,
  onNoteBody,
  notes,
}: {
  noteBody: string;
  onNoteBody: (value: string) => void;
  notes: readonly { noteId: string; body: string; createdAt: string }[];
}) {
  return (
    <section className="section">
      <h2>Editorial notes</h2>
      <p>Notes stay outside the canonical package.</p>
      <label htmlFor="editorial-note">Note</label>
      <textarea id="editorial-note" rows={4} value={noteBody} onChange={(event) => onNoteBody(event.target.value)} />
      <ul className="study-list">
        {notes.map((note) => <li key={note.noteId}>{note.createdAt} · {note.body}</li>)}
      </ul>
    </section>
  );
}
