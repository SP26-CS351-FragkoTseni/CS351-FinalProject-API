import '../panel.css';

export function TasksPage() {
  return (
    <section className="panel">
      <h2>Tasks</h2>
      <p className="lead">
        Skeleton route. Next steps: call <code>getTasks()</code> from <code>tasks-reminders-api</code> with query params
        (<code>status</code>, <code>due_before</code>, <code>list_id</code>, <code>priority</code>), render a list, and use{' '}
        <code>PATCH /tasks/:id/complete</code> for the checkbox toggle.
      </p>
      <p className="muted">Deep link example (after you build the table): <code>/tasks/42</code> for detail + reminders.</p>
    </section>
  );
}
