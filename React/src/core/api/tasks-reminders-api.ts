import { buildQuery, apiJson } from './client';
import type {
  Reminder,
  Task,
  TaskList,
  TaskPriority,
  TaskStatusFilter,
  UserProfile,
} from '../models/api.types';

/**
 * Typed fetch wrappers for the Tasks & Reminders API.
 * Feature route components should import from here — pages below are skeletons until wired.
 */
export function getProfile(): Promise<UserProfile> {
  return apiJson<UserProfile>('/auth/me');
}

export function updateProfile(body: Partial<{ name: string; email: string; password: string }>): Promise<UserProfile> {
  return apiJson<UserProfile>('/auth/me', { method: 'PATCH', body: JSON.stringify(body) });
}

export function getTasks(filters?: {
  status?: TaskStatusFilter;
  due_before?: string;
  due_after?: string;
  list_id?: number;
  priority?: TaskPriority;
}): Promise<Task[]> {
  const q = filters
    ? buildQuery({
        status: filters.status,
        due_before: filters.due_before,
        due_after: filters.due_after,
        list_id: filters.list_id,
        priority: filters.priority,
      })
    : '';
  return apiJson<Task[]>(`/tasks${q}`);
}

export function getTask(id: number): Promise<Task> {
  return apiJson<Task>(`/tasks/${id}`);
}

export function createTask(body: Partial<Task> & { title: string }): Promise<Task> {
  return apiJson<Task>('/tasks', { method: 'POST', body: JSON.stringify(body) });
}

export function updateTask(id: number, body: Partial<Task>): Promise<Task> {
  return apiJson<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}

export function deleteTask(id: number): Promise<void> {
  return apiJson<void>(`/tasks/${id}`, { method: 'DELETE' });
}

export function toggleTaskComplete(id: number): Promise<Task> {
  return apiJson<Task>(`/tasks/${id}/complete`, { method: 'PATCH', body: JSON.stringify({}) });
}

export function getLists(): Promise<TaskList[]> {
  return apiJson<TaskList[]>('/lists');
}

export function createList(body: { name: string }): Promise<TaskList> {
  return apiJson<TaskList>('/lists', { method: 'POST', body: JSON.stringify(body) });
}

export function updateList(id: number, body: Partial<TaskList>): Promise<TaskList> {
  return apiJson<TaskList>(`/lists/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}

export function deleteList(id: number): Promise<void> {
  return apiJson<void>(`/lists/${id}`, { method: 'DELETE' });
}

export function getTasksForList(listId: number): Promise<Task[]> {
  return apiJson<Task[]>(`/lists/${listId}/tasks`);
}

export function getReminders(taskId: number): Promise<Reminder[]> {
  return apiJson<Reminder[]>(`/tasks/${taskId}/reminders`);
}

export function createReminder(taskId: number, body: unknown): Promise<Reminder> {
  return apiJson<Reminder>(`/tasks/${taskId}/reminders`, { method: 'POST', body: JSON.stringify(body) });
}

export function updateReminder(taskId: number, reminderId: number, body: unknown): Promise<Reminder> {
  return apiJson<Reminder>(`/tasks/${taskId}/reminders/${reminderId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function deleteReminder(taskId: number, reminderId: number): Promise<void> {
  return apiJson<void>(`/tasks/${taskId}/reminders/${reminderId}`, { method: 'DELETE' });
}
