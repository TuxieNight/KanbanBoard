## Taskboard
View the tool yourself here: <href a="https://tuxienight.github.io/KanbanBoard/">https://tuxienight.github.io/KanbanBoard/</href>.

Taskboard is a lightweight Kanban-style task management tool built with <strong>React</strong>, <strong>Supabase</strong>, and <strong>dnd‑kit</strong>. The goal of this project is to provide a clean, responsive interface for organizing work without the overhead or complexity of larger project management platforms. Tasks can be created, updated, and moved between columns, and all changes are persisted through Supabase.

## Features
- Four-column workflow: To Do, In Progress, In Review, Done
- Drag-and-drop task movement using dnd‑kit
- Anonymous Supabase authentication (no login required)
- Task creation with:
  - Title
  - Description
  - Priority
  - Due date
- Overdue tasks with glowing red borders for optimized scheduling
- Collapsible columns for improved visibility
- Sidebar summary with task counts
- Responsive layout for desktop and mobile

## Technology Stack
- React — component architecture and UI
- Supabase — database, authentication, and persistence
- dnd‑kit — drag-and-drop interactions
- React Bootstrap — layout and form components

## How It Works
When the application loads, it checks for an existing Supabase user. If none is found, an anonymous user is created automatically. All tasks are tied to this user ID, and users can only see the tasks they create.

Dragging a task updates the UI immediately and then writes the change to Supabase to improve user experience. Once the update completes, the application re-fetches tasks to ensure the board always reflects the authoritative state in the database.

Creating a task appends it to the todo list without disrupting the existing board state.
