import { Component, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { TasksRemindersApiService } from '../../core/api/tasks-reminders-api.service';
import { Task, Reminder } from '../../core/models/api.types';

@Component({
  selector: 'app-task-detail-page',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './task-detail-page.component.html',
  styleUrls: ['./task-detail-page.component.scss'],
})
export class TaskDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(TasksRemindersApiService);

  readonly task = signal<Task | null>(null);
  readonly reminders = signal<Reminder[]>([]);

  constructor() {
    // Load task
    this.route.paramMap.pipe(
      map(p => Number(p.get('id'))),
      switchMap(id => this.api.getTask(id))
    ).subscribe(task => this.task.set(task));

    // Load reminders
    this.route.paramMap.pipe(
      map(p => Number(p.get('id'))),
      switchMap(id => this.api.getReminders(id))
    ).subscribe(reminders => this.reminders.set(reminders));
  }

  editTask() {
    const t = this.task();
    if (!t) return;

    const title = prompt('New title:', t.title);
    if (!title) return;

    this.api.updateTask(t.id, { title }).subscribe(updated => {
      this.task.set(updated);
    });
  }

  deleteTask() {
    const t = this.task();
    if (!t) return;

    if (!confirm('Delete this task?')) return;

    this.api.deleteTask(t.id).subscribe(() => {
      history.back();
    });
  }

  addReminder() {
    const t = this.task();
    if (!t) return;

    const time = prompt('Reminder time (HH:MM)');
    if (!time) return;

    const today = new Date().toISOString().split('T')[0];

    this.api.createReminder(t.id, {
      remind_at: `${today}T${time}:00`,
      delivery_method: 'popup'
    }).subscribe((newReminder: Reminder) => {
      this.reminders.set([...this.reminders(), newReminder]);
    });
  }

  deleteReminder(id: number) {
    const t = this.task();
    if (!t) return;

    this.api.deleteReminder(t.id, id).subscribe(() => {
      this.reminders.set(this.reminders().filter(r => r.id !== id));
    });
  }
}
