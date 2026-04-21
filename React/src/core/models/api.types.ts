export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface ApiErrorBody {
  error?: {
    code?: number;
    message?: string;
  };
}

/** Skeleton types — extend as you wire the UI to the API. */
export interface UserProfile {
  id?: number;
  name?: string;
  email?: string;
}

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatusFilter = 'pending' | 'completed';

export interface Task {
  id: number;
  title: string;
  due_date: string | null;
  priority: TaskPriority;
  completed: boolean;
  list_id: number | null;
  created_at: string;
}

export interface TaskList {
  id: number;
  name: string;
  created_at?: string;
}

export interface Reminder {
  id: number;
  remind_at: string;
  delivery_method?: string;
}
