import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Reminder,
  Task,
  TaskList,
  TaskPriority,
  TaskStatusFilter,
  UserProfile,
} from '../models/api.types';

/**
 * Typed HTTP wrappers for the Tasks & Reminders API.
 * UI feature modules should inject this service — components below are skeletons until wired.
 */
@Injectable({ providedIn: 'root' })
export class TasksRemindersApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.base}/auth/me`);
  }

  updateProfile(body: Partial<{ name: string; email: string; password: string }>): Observable<UserProfile> {
    return this.http.patch<UserProfile>(`${this.base}/auth/me`, body);
  }

  getTasks(filters?: {
    status?: TaskStatusFilter;
    due_before?: string;
    due_after?: string;
    list_id?: number;
    priority?: TaskPriority;
  }): Observable<Task[]> {
    let params = new HttpParams();
    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    if (filters?.due_before) {
      params = params.set('due_before', filters.due_before);
    }
    if (filters?.due_after) {
      params = params.set('due_after', filters.due_after);
    }
    if (filters?.list_id != null) {
      params = params.set('list_id', String(filters.list_id));
    }
    if (filters?.priority) {
      params = params.set('priority', filters.priority);
    }
    return this.http.get<Task[]>(`${this.base}/tasks`, { params });
  }

  getTask(id: number): Observable<Task> {
    return this.http.get<Task>(`${this.base}/tasks/${id}`);
  }

  createTask(body: Partial<Task> & { title: string }): Observable<Task> {
    return this.http.post<Task>(`${this.base}/tasks`, body);
  }

  updateTask(id: number, body: Partial<Task>): Observable<Task> {
    return this.http.patch<Task>(`${this.base}/tasks/${id}`, body);
  }

  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/tasks/${id}`);
  }

  toggleTaskComplete(id: number): Observable<Task> {
    return this.http.patch<Task>(`${this.base}/tasks/${id}/complete`, {});
  }

  getLists(): Observable<TaskList[]> {
    return this.http.get<TaskList[]>(`${this.base}/lists`);
  }

  createList(body: { name: string }): Observable<TaskList> {
    return this.http.post<TaskList>(`${this.base}/lists`, body);
  }

  updateList(id: number, body: Partial<TaskList>): Observable<TaskList> {
    return this.http.patch<TaskList>(`${this.base}/lists/${id}`, body);
  }

  deleteList(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/lists/${id}`);
  }

  getTasksForList(listId: number): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.base}/lists/${listId}/tasks`);
  }

  getReminders(taskId: number): Observable<Reminder[]> {
    return this.http.get<Reminder[]>(`${this.base}/tasks/${taskId}/reminders`);
  }

  createReminder(taskId: number, body: unknown): Observable<Reminder> {
    return this.http.post<Reminder>(`${this.base}/tasks/${taskId}/reminders`, body);
  }

  updateReminder(taskId: number, reminderId: number, body: unknown): Observable<Reminder> {
    return this.http.patch<Reminder>(`${this.base}/tasks/${taskId}/reminders/${reminderId}`, body);
  }

  deleteReminder(taskId: number, reminderId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/tasks/${taskId}/reminders/${reminderId}`);
  }
}
