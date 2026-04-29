# CS351 Final Project: Tasks & Reminders

This repository contains a full-stack Tasks & Reminders application made up of two parts:

- `API/` - an Express + SQLite backend that provides authentication, tasks, lists, reminders, and user profile endpoints.
- `Angular/` - an Angular frontend that consumes the API and provides the UI for logging in, viewing tasks, managing lists, and editing profile data.

## What it does

The application lets a signed-in user:

- log in and log out with bearer-token authentication
- view, create, edit, delete, and complete tasks
- create, rename, delete, and inspect task lists
- view the tasks that belong to a specific list
- manage reminders for tasks
- update their profile information

## API Overview

The backend exposes a versioned API under `/v1` with these main routes:

- `POST /v1/auth/login`
- `POST /v1/auth/logout`
- `GET /v1/auth/me`
- `PATCH /v1/auth/me`
- `GET /v1/tasks`
- `POST /v1/tasks`
- `GET /v1/tasks/:id`
- `PATCH /v1/tasks/:id`
- `PATCH /v1/tasks/:id/complete`
- `DELETE /v1/tasks/:id`
- `GET /v1/lists`
- `POST /v1/lists`
- `PATCH /v1/lists/:id`
- `DELETE /v1/lists/:id`
- `GET /v1/lists/:id/tasks`
- `GET /v1/tasks/:taskId/reminders`
- `POST /v1/tasks/:taskId/reminders`
- `PATCH /v1/tasks/:taskId/reminders/:reminderId`
- `DELETE /v1/tasks/:taskId/reminders/:reminderId`

## Frontend Overview

The Angular app includes pages for:

- login
- task list and task details
- task list management
- profile management

It is routed so authenticated users land in the app shell, while unauthenticated users are redirected to login.

## Authors

- Marc Robertson
- Ian Cowie
- Fragkoula Tseni

## Running the Project

### API

From the `API/` directory:

```bash
npm install
npm start
```

The server runs on `http://localhost:3000/v1` by default.

### Angular Frontend

From the `Angular/` directory:

```bash
npm install
npm start
```

The frontend runs on `http://localhost:4200` by default and is configured to talk to the local API.

## Notes

- The frontend expects the API base URL in `Angular/src/environments/environment.ts`.
- The API uses SQLite for local persistence.
- Authentication is bearer-token based.
