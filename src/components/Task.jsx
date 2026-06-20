import { Card, Container } from 'react-bootstrap';

// Normalize Supabase timestamps (with or without timezone) into Date objects.
function parseTimestamp(value) {
  if (typeof value !== 'string') return new Date(value);

  const hasTimezone = /[zZ]|[+-]\d{2}:?\d{2}$/.test(value);
  return hasTimezone ? new Date(value) : new Date(`${value}Z`);
}

// Convert a timestamp into a human-readable relative time string.
function formatRelativeTime(value) {
  const date = parseTimestamp(value);
  if (Number.isNaN(date.getTime())) return '';

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const absSeconds = Math.abs(seconds);

  if (absSeconds < 60) return 'just now';

  const units = [
    { label: 'year', value: 31557600 },
    { label: 'month', value: 2629800 },
    { label: 'week', value: 604800 },
    { label: 'day', value: 86400 },
    { label: 'hour', value: 3600 },
    { label: 'minute', value: 60 },
    { label: 'second', value: 1 },
  ];

  const unit = units.find((item) => absSeconds >= item.value);
  if (!unit) return 'just now';

  const amount = Math.floor(absSeconds / unit.value);
  const plural = amount === 1 ? '' : 's';

  return seconds > 0
    ? `${amount} ${unit.label}${plural} ago`
    : `in ${amount} ${unit.label}${plural}`;
}

// Renders a single task card with priority, timestamps, and overdue styling.
export default function Task(props) {
  const createdAt = props.created_at ? formatRelativeTime(props.created_at) : '';
  const dueDate = props.due_date ? formatRelativeTime(props.due_date) : '';

  const priorityClass = props.priority
    ? `priority-tag priority-${String(props.priority).toLowerCase()}`
    : 'priority-tag';

  const isOverdue = dueDate.includes('ago') && props.status !== 'done';

  return (
    <Card className={`task-card ${isOverdue ? 'task-overdue' : ''}`}>
      <Container>
        <h2 className="text-center">{props.title}</h2>

        <p>
          <span className={priorityClass}>{props.priority}</span>
        </p>

        {createdAt && <p><em>Posted: {createdAt}</em></p>}

        {props.description && <p>{props.description}</p>}

        {dueDate && (
          <p>
            <strong>Due: {dueDate}</strong>
          </p>
        )}

        {props.assignee_id}
      </Container>
    </Card>
  );
}