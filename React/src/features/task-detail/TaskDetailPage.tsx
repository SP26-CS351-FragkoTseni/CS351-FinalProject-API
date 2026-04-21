import { useParams } from 'react-router-dom';
import '../panel.css';

export function TaskDetailPage() {
  const { id } = useParams();

  return (
    <section className="panel">
      <h2>Task detail</h2>
      <p className="lead">
        Skeleton for <code>GET /tasks/:id</code>, <code>PATCH /tasks/:id</code>, and reminders under{' '}
        <code>/tasks/:taskId/reminders</code>.
      </p>
      <p className="muted">
        Current route param <code>id</code>: <strong>{id ?? '—'}</strong>
      </p>
    </section>
  );
}
