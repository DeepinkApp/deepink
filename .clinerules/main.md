# Working rules

- Read the repository's `AGENTS.md` and any applicable nested `AGENTS.md` before making changes. Follow their instructions.
- Use Cline APIs for repository inspection and changes. Never use shell commands to list, search, or read repository files (for example, `ls`, `grep`, `find`, or `cat`); use the corresponding Cline API instead.
- If a Cline API lacks a capability, do not automatically substitute a shell command. First decide whether the operation is necessary and whether you can proceed safely with the available APIs. If not, stop and ask before using a command.
- Use a shell command only after explaining why the API-based approach is insufficient and getting the user's authorization. Show the exact command first, keep it simple and transparent, and do not hide scripts or combine unrelated operations.
- Do not search or inspect `node_modules`. Use authoritative online documentation for dependency docs instead.