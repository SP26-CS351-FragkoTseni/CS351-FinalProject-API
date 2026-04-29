import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TasksRemindersApiService } from '../../core/api/tasks-reminders-api.service';
import { Task, TaskList } from '../../core/models/api.types';

@Component({
  selector: 'app-lists-page',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule],
  templateUrl: './lists-page.component.html',
  styleUrls: ['./lists-page.component.scss'],
})
export class ListsPageComponent implements OnInit {
  lists: TaskList[] = [];
  loading = true;
  loaded = false;
  errorMessage: string | null = null;

  newListName = '';
  creatingList = false;
  createError: string | null = null;

  editingListId: number | null = null;
  editListName = '';
  updatingList = false;
  updateError: string | null = null;
  deletingListId: number | null = null;
  deleteError: string | null = null;

  expandedListId: number | null = null;
  expandedListTasks: Task[] = [];
  loadingTasks = false;
  tasksError: string | null = null;

  constructor(private api: TasksRemindersApiService) {}

  ngOnInit(): void {
    this.loadLists();
  }

  loadLists(): void {
    this.loading = true;
    this.errorMessage = null;

    this.api.getLists().subscribe({
      next: (lists) => {
        this.lists = lists;
        this.loading = false;
        this.loaded = true;
      },
      error: (error) => {
        this.loading = false;
        this.loaded = true;
        this.errorMessage = error?.error?.error?.message ?? 'Failed to load lists.';
      },
    });
  }

  /** Force a network refresh (adds cache-busting query param) */
  refresh(): void {
    this.loading = true;
    this.errorMessage = null;
    this.api.getLists(true).subscribe({
      next: (lists) => {
        this.lists = lists;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.error?.message ?? 'Failed to load lists.';
      },
    });
  }

  createList(): void {
    const name = this.newListName.trim();
    if (!name) {
      this.createError = 'Please enter a list name.';
      return;
    }

    this.creatingList = true;
    this.createError = null;

    const tempList: TaskList = {
      id: -(Date.now()),
      name,
      created_at: new Date().toISOString(),
    };
    this.lists = [...this.lists, tempList];
    this.newListName = '';
    this.creatingList = false;

    this.api.createList({ name }).subscribe({
      next: (newList) => {
        this.lists = this.lists.map((item) => (item.id === tempList.id ? newList : item));
      },
      error: (error) => {
        this.lists = this.lists.filter((item) => item.id !== tempList.id);
        this.createError = error?.error?.error?.message ?? 'Failed to create list.';
      },
    });
  }

  startEditList(list: TaskList): void {
    this.editingListId = list.id;
    this.editListName = list.name;
    this.updateError = null;
  }

  cancelEditList(): void {
    this.editingListId = null;
    this.editListName = '';
    this.updateError = null;
  }

  saveEditList(list: TaskList): void {
    const name = this.editListName.trim();
    if (!name) {
      this.updateError = 'Please enter a list name.';
      return;
    }

    this.updatingList = true;
    this.updateError = null;

    this.api.updateList(list.id, { name }).subscribe({
      next: (updatedList) => {
        this.lists = this.lists.map((item) => (item.id === updatedList.id ? updatedList : item));
        this.editingListId = null;
        this.editListName = '';
        this.updatingList = false;
      },
      error: (error) => {
        this.updatingList = false;
        this.updateError = error?.error?.error?.message ?? 'Failed to update list.';
      },
    });
  }

  deleteList(list: TaskList): void {
    if (!confirm(`Delete list "${list.name}"? This cannot be undone.`)) return;

    this.deletingListId = list.id;
    this.deleteError = null;

    this.api.deleteList(list.id).subscribe({
      next: () => {
        this.lists = this.lists.filter((l) => l.id !== list.id);
        if (this.editingListId === list.id) this.cancelEditList();
        if (this.expandedListId === list.id) this.expandedListId = null;
        this.expandedListTasks = [];
        this.tasksError = null;
        this.deletingListId = null;
      },
      error: (error) => {
        this.deletingListId = null;
        this.deleteError = error?.error?.error?.message ?? 'Failed to delete list.';
      },
    });
  }
  // Toggle expand/collapse of a list to show its tasks. If expanding, load the tasks for that list.
  toggleExpandList(list: TaskList): void {
    if (this.expandedListId === list.id) {
      this.expandedListId = null;
      this.expandedListTasks = [];
      this.tasksError = null;
      return;
    }

    this.expandedListId = list.id;
    this.expandedListTasks = [];
    this.loadingTasks = true;
    this.tasksError = null;

    this.api.getTasksForList(list.id).subscribe({
      next: (tasks) => {
        this.expandedListTasks = tasks;
        this.loadingTasks = false;
      },
      error: (error) => {
        this.loadingTasks = false;
        this.tasksError = error?.error?.error?.message ?? 'Failed to load tasks.';
      },
    });
  }
}
