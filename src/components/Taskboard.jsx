import React, {
  useState,
  useEffect,
  useContext,
  useMemo,
  useRef,
} from 'react';
import { Container, Row, Col, Form } from 'react-bootstrap';
import { supabase } from '../supabase.js';
import UserContext from '../contexts/UserContext';
import DraggableTask from './DraggableTask.jsx';
import DroppableColumn from './DroppableColumn.jsx';
import Task from './Task.jsx';

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';

/* -------------------------------------------------------------------------- */
/*  Column definitions                                                        */
/* -------------------------------------------------------------------------- */

const columns = [
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'in_review', title: 'In Review' },
  { id: 'done', title: 'Done' },
];

/* -------------------------------------------------------------------------- */
/*  Authentication + Data Helpers                                             */
/* -------------------------------------------------------------------------- */

// Ensure a user exists; create an anonymous user if needed.
async function ensureUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) return user;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return data.user;
}

// Fetch all tasks ordered by creation time.
async function getTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }

  return data;
}

/* -------------------------------------------------------------------------- */
/*  Main Taskboard Component                                                  */
/* -------------------------------------------------------------------------- */

export default function Taskboard() {
  const [id, setId] = useContext(UserContext);
  const [tasks, setTasks] = useState([]);
  const [collapsedColumns, setCollapsedColumns] = useState([]);
  const [error, setError] = useState('');
  const [activeTask, setActiveTask] = useState(null);

  /* ----------------------------- Form Refs -------------------------------- */

  const titleRef = useRef();
  const descRef = useRef();
  const priorityRef = useRef();
  const dueRef = useRef();

  /* ----------------------------- Drag Sensors ------------------------------ */

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  /* ------------------------------------------------------------------------ */
  /*  Create a new task                                                      */
  /* ------------------------------------------------------------------------ */

  async function addTask() {
    const title = titleRef.current.value.trim();
    const description = descRef.current.value.trim();
    const priority = priorityRef.current.value;
    const due_date = dueRef.current.value.trim();

    if (!title) {
      setError('A title is required to create a task.');
      return;
    }

    setError('');

    const { data: inserted, error: insertError } = await supabase
      .from('tasks')
      .insert({
        title,
        description: description || null,
        priority,
        due_date: due_date || null,
        assignee_id: null,
        user_id: id,
        status: 'todo',
      })
      .select()
      .single();

    if (insertError) {
      console.error(insertError);
      setError(insertError.message || 'Failed to create task.');
      return;
    }

    // Clear form
    titleRef.current.value = '';
    descRef.current.value = '';
    priorityRef.current.value = 'normal';
    dueRef.current.value = '';

    // Append new task without overwriting statuses
    setTasks(prev => [...prev, inserted]);
  }

  /* ------------------------------------------------------------------------ */
  /*  Initial load: ensure user + fetch tasks                                 */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    (async () => {
      const user = await ensureUser();
      setId(user.id);

      const data = await getTasks();
      setTasks(data);
    })();
  }, [setId]);

  /* ------------------------------------------------------------------------ */
  /*  Group tasks by status                                                   */
  /* ------------------------------------------------------------------------ */

  const tasksByStatus = useMemo(() => {
    return columns.reduce((acc, col) => {
      acc[col.id] = tasks.filter(t => t.status === col.id);
      return acc;
    }, {});
  }, [tasks]);

  /* ------------------------------------------------------------------------ */
  /*  Column collapse toggle                                                  */
  /* ------------------------------------------------------------------------ */

  function toggleColumn(columnId) {
    setCollapsedColumns(current =>
      current.includes(columnId)
        ? current.filter(id => id !== columnId)
        : [...current, columnId]
    );
  }

  /* ------------------------------------------------------------------------ */
  /*  Drag-and-drop: guaranteed consistency                                   */
  /* ------------------------------------------------------------------------ */

  async function handleDragEnd({ active, over }) {
    if (!over) return;

    const activeId = active.id;
    const newColumn = over.id;

    // Optimistic UI update
    setTasks(prev =>
      prev.map(t =>
        t.id === activeId ? { ...t, status: newColumn } : t
      )
    );

    setActiveTask(null);

    // Persist to DB
    const { error } = await supabase
      .from('tasks')
      .update({ status: newColumn })
      .eq('id', activeId);

    // Guaranteed consistency: re-fetch authoritative data
    if (!error) {
      const updated = await getTasks();
      setTasks(updated);
    }
  }

  /* ------------------------------------------------------------------------ */
  /*  Render                                                                  */
  /* ------------------------------------------------------------------------ */

  return (
    <Container fluid className="py-4 min-vh-100 d-flex flex-column">
      <h2>Your Tasks</h2>

      <Row className="taskboard-row">
        {/* ------------------------------------------------------------------ */}
        {/*  Sidebar                                                          */}
        {/* ------------------------------------------------------------------ */}

        <Col xs={12} md={3} className="sidebar-col">
          <div className="tasks-bg-fill">
            <div className="tasks-column">
              <div className="tasks-panel">

                {/* Summary */}
                <div className="task-summary mb-3">
                  <h6 className="summary-title">Summary</h6>

                  <div className="summary-row">
                    <span>Total Tasks</span>
                    <span>{tasks.length}</span>
                  </div>

                  <div className="summary-row">
                    <span>Completed</span>
                    <span>{tasks.filter(t => t.status === 'done').length}</span>
                  </div>

                  <div className="summary-row">
                    <span>Overdue</span>
                    <span>
                      {tasks.filter(t => {
                        if (!t.due_date) return false;
                        return new Date(t.due_date) < new Date() && t.status !== 'done';
                      }).length}
                    </span>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="alert alert-danger py-2">
                    {error}
                  </div>
                )}

                {/* Task Form */}
                <div className="task-form">
                  <h4 className="form-section-title">Create a Task</h4>

                  <Form.Group className="mb-3">
                    <Form.Label className="form-label-strong">Title</Form.Label>
                    <Form.Control
                      ref={titleRef}
                      placeholder="e.g., Fix login bug"
                      className="form-input"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      ref={descRef}
                      as="textarea"
                      rows={2}
                      placeholder="Optional details or context"
                      className="form-input"
                    />
                  </Form.Group>

                  <h5 className="form-section-subtitle">Scheduling</h5>

                  <Form.Group className="mb-3">
                    <Form.Label>Due Date</Form.Label>
                    <Form.Control
                      ref={dueRef}
                      type="date"
                      className="form-input"
                    />
                  </Form.Group>

                  <h5 className="form-section-subtitle">Task Settings</h5>

                  <Form.Group className="mb-3">
                    <Form.Label>Priority</Form.Label>
                    <Form.Select
                      ref={priorityRef}
                      defaultValue="normal"
                      className="form-input"
                    >
                      <option value="low">Low Priority</option>
                      <option value="normal">Normal Priority</option>
                      <option value="high">High Priority</option>
                    </Form.Select>
                  </Form.Group>

                  <button
                    type="button"
                    onClick={addTask}
                    className="btn btn-primary w-100 mt-2"
                  >
                    Add Task
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Col>

        {/* ------------------------------------------------------------------ */}
        {/*  Board Columns                                                    */}
        {/* ------------------------------------------------------------------ */}

        <Col xs={12} md={9} className="board-area d-flex flex-column order-2 order-md-0">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={({ active }) => {
              const task = tasks.find(t => t.id === active.id);
              setActiveTask(task || null);
            }}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveTask(null)}
          >
            <Row xs={1} md={2} lg={4} className="status-row">
              {columns.map(column => (
                <Col key={column.id} className="board-column">
                  <DroppableColumn id={column.id}>
                    <div
                      className={`column-panel ${
                        collapsedColumns.includes(column.id)
                          ? 'column-panel-collapsed'
                          : ''
                      }`}
                    >
                      <div className="column-header">
                        <h3 className="column-title">{column.title}</h3>
                        <button
                          type="button"
                          className="column-toggle"
                          onClick={() => toggleColumn(column.id)}
                        >
                          {collapsedColumns.includes(column.id) ? '+' : '−'}
                        </button>
                      </div>

                      {!collapsedColumns.includes(column.id) && (
                        <div className="d-grid gap-2 column-content">
                          {tasksByStatus[column.id].map(task => (
                            <DraggableTask key={task.id} {...task} />
                          ))}
                          {tasksByStatus[column.id].length === 0 && <p>No tasks.</p>}
                        </div>
                      )}
                    </div>
                  </DroppableColumn>
                </Col>
              ))}
            </Row>

            <DragOverlay dropAnimation={null}>
              {activeTask ? <Task {...activeTask} /> : null}
            </DragOverlay>
          </DndContext>
        </Col>
      </Row>
    </Container>
  );
}