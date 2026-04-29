import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TasksRemindersApiService } from '../../core/api/tasks-reminders-api.service';
import { Task } from '../../core/models/api.types';

@Component({
  selector: 'app-tasks-page',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  templateUrl: './tasks-page.component.html',
  styleUrls: ['./tasks-page.component.scss'],
})
export class TasksPageComponent implements OnInit{
  tasks: Task[] = [];

  get pendingTasks(): Task[] {
    return this.tasks.filter(t => !t.completed);
  }

  get completedTasks(): Task[] {
    return this.tasks.filter(t => t.completed);
  }

  constructor(private api: TasksRemindersApiService){}

  ngOnInit(){
    this.loadTasks();
  }


  loadTasks() {
  this.api.getTasks().subscribe((data) => {
    // Remove the fake init task
    this.tasks = data;
    });
  }

  toggleComplete(task: Task) {
  this.api.toggleTaskComplete(task.id).subscribe((updatedTask) => {
    task.completed = updatedTask.completed; // update UI immediately
  });
  }


  deleteTask(task: Task) {
  if (!confirm(`Delete task "${task.title}"?`)) return;

  this.api.deleteTask(task.id).subscribe(() => {
    this.tasks = this.tasks.filter(t => t.id !== task.id);
  });
  }
  createTask() {
    const title = prompt('Task title?');
    if (!title) return;

    const date = prompt('Due date? (YYYY-MM-DD or leave empty)');
    const time = prompt('Time? (HH:MM, 24-hour)');
    const priority = prompt('Priority? (low, medium, high)');

    let due_date: string | null = null;

  if (date) {
    due_date = time
      ? `${date}T${time}:00`
      : `${date}T00:00:00`;
  }
    this.api.createTask({ 
      title,
      due_date: due_date || null,
      priority: (priority as any) || 'medium'
    }).subscribe((newTask) => {
    this.tasks = [...this.tasks, newTask];
    });
  }
}
