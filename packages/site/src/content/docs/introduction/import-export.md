---
title: Import & Export
---

Deepink gives you full control over your notes.

You can import notes from external files into Deepink or export your notes at any time for backup, migration, or use in other applications.

Your data remains portable, making it easy to move notes between devices and services.

## Import

If you already have some notes from another app, you can import them into Deepink.

- Click "Global Settings" icon
- Open tab "Import & Export"
- Drop your files, directories or ZIP archive to import

Any attached files will be uploaded automatically. The markdown links will be resolved and preserved.

Some meta information in frontmatter header of markdown files will be used. Specifically the creation and update time, title and tags.

The directories structure will be preserved as a tags tree. For example if you will drop directory `notes`, a file `notes/diary/sport/june.md` will be imported as note with name `june` and tag `diary/sport` will be assigned.

## Export

You can export as single note as whole workspace.

To export one note, open note menu and click "Export..." and select directory to save.

To export whole workspace:

- Click "Global Settings" icon
- Open tab "Import & Export"
- Click "Export notes"

This way let you export all notes in active workspace. If you have many workspaces, you can do that for all of them one by one, since Deepink isolates your workspace content, and other workspaces knows only their own content.