import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import { Container, Row, Col, Form } from 'react-bootstrap';
import { supabase } from '../supabase.js';
import UserContext from '../contexts/UserContext';
import Task from './Task.jsx';

const columns = [
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'in_review', title: 'In Review' },
  { id: 'done', title: 'Done' },
];

async function ensureUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) return user;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return data.user;
}

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

export default function Taskboard() {
  const [id, setId] = useContext(UserContext);
  const [tasks, setTasks] = useState([]);
  const [collapsedColumns, setCollapsedColumns] = useState([]);
  const [error, setError] = useState('');

  // Form fields
  const titleRef = useRef();
  const descRef = useRef();
  const priorityRef = useRef();
  const dueRef = useRef();
  const assigneeRef = useRef();

  async function addTask() {
    const title = titleRef.current.value.trim();
    const description = descRef.current.value.trim();
    const priority = priorityRef.current.value;
    const due_date = dueRef.current.value.trim();
    const assignee_id = assigneeRef.current.value.trim();

    if (!title) {
        setError('A title is required to create a task.');
        return;
    }

    setError('');

    const { error } = await supabase.from('tasks').insert({
        title,
        description: description || null,
        priority,
        due_date: due_date || null,
        assignee_id: assignee_id || null,
        user_id: id,
        status: 'todo',
    });

    if (error) {
        console.error(error);
        setError(error.message || 'Failed to create task.');
        return;
    }

    // Clear form
    titleRef.current.value = '';
    descRef.current.value = '';
    priorityRef.current.value = 'normal';
    dueRef.current.value = '';
    assigneeRef.current.value = '';

    const updated = await getTasks();
    setTasks(updated);
  }


  useEffect(() => {
    (async () => {
      const user = await ensureUser();
      setId(user.id);

      const data = await getTasks();
      setTasks(data);
    })();
  }, [setId]);

  const tasksByStatus = useMemo(() => {
    return columns.reduce((acc, col) => {
      acc[col.id] = tasks.filter((t) => t.status === col.id);
      return acc;
    }, {});
  }, [tasks]);

  function toggleColumn(columnId) {
    setCollapsedColumns((current) =>
      current.includes(columnId)
        ? current.filter((id) => id !== columnId)
        : [...current, columnId]
    );
  }

  return (
    <Container fluid className="py-4 min-vh-100 d-flex flex-column">
      <h2>Your Tasks</h2>

      <Row className="taskboard-row">
        {/* Sidebar */}
        <Col xs={12} md={3} className="sidebar-col">
          <div className="tasks-bg-fill">
            <div className="tasks-column">
              <div className="tasks-panel">

                {/* Error message */}
                {error && (
                  <div className="alert alert-danger py-2">
                    {error}
                  </div>
                )}

                <div className="tasks-add-task" style={{ marginBottom: '1rem' }}>
                  <Form.Control ref={titleRef} placeholder="Title (required)" className="mb-2" />
                  <Form.Control ref={descRef} placeholder="Description" className="mb-2" />

                  <Form.Select ref={priorityRef} defaultValue="normal" className="mb-2">
                    <option value="low">Low Priority</option>
                    <option value="normal">Normal Priority</option>
                    <option value="high">High Priority</option>
                  </Form.Select>

                  <Form.Control ref={dueRef} type="date" className="mb-2" />

                  <Form.Control ref={assigneeRef} placeholder="Assignee ID" className="mb-2" />

                  <button onClick={addTask} className="btn btn-primary mt-2 w-100">
                    Add Task
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Col>

        {/* Board */}
        <Col xs={12} md={9} className="board-area d-flex flex-column order-2 order-md-0">
          <Row xs={1} md={2} lg={4} className="align-items-start">
            {columns.map((column) => (
              <Col key={column.id} className="board-column">
                <div className={`column-panel ${collapsedColumns.includes(column.id) ? 'column-panel-collapsed' : ''}`}>
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
                      {tasksByStatus[column.id].map((task) => (
                        <Task key={task.id} {...task} />
                      ))}
                      {tasksByStatus[column.id].length === 0 && <p>No tasks.</p>}
                    </div>
                  )}
                </div>
              </Col>
            ))}
          </Row>
        </Col>
      </Row>
    </Container>
  );
}