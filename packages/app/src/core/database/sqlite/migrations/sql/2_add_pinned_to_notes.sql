ALTER TABLE notes
ADD COLUMN pinned_at INTEGER;

DROP INDEX idx_notes_workspace_status;

CREATE INDEX idx_notes_workspace_status
  ON notes(workspace_id, deleted_at, archived, bookmarked, visible, pinned_at, updated_at DESC);