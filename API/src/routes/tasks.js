const express = require("express");
const { sendError } = require("../errors");
const { requireAuth } = require("../middleware/requireAuth");

const PRIORITIES = new Set(["low", "medium", "high"]);

function taskJson(t) {
  return {
    id: t.id,
    title: t.title,
    due_date: t.due_date,
    priority: t.priority,
    completed: t.completed,
    list_id: t.list_id,
    created_at: t.created_at,
  };
}

function createTasksRouter(store) {
  const router = express.Router();
  router.use(requireAuth);

  router.get("/", (req, res) => {
    const { status, due_before, due_after, list_id, priority } = req.query;
    if (priority && !PRIORITIES.has(String(priority))) {
      return sendError(res, 400, "Invalid priority filter.");
    }
    if (status && status !== "pending" && status !== "completed") {
      return sendError(res, 400, "Invalid status filter.");
    }
    const rows = store.tasksForUser(req.userId, {
      status: status || undefined,
      due_before: due_before || undefined,
      due_after: due_after || undefined,
      list_id: list_id !== undefined ? list_id : undefined,
      priority: priority || undefined,
    });
    res.json(rows.map(taskJson));
  });

  router.post("/", (req, res) => {
    const { title, due_date, priority, list_id } = req.body || {};
    if (!title || typeof title !== "string") {
      return sendError(res, 400, "Missing or invalid title.");
    }
    if (priority != null && !PRIORITIES.has(priority)) {
      return sendError(res, 400, "Invalid priority.");
    }
    const result = store.createTask(req.userId, {
      title,
      due_date,
      priority: priority || "medium",
      list_id,
    });
    if (result.error === "list_notfound") return sendError(res, 404, "List not found.");
    if (result.error === "forbidden") return sendError(res, 403, "Not allowed to use this list.");
    res.status(201).json(taskJson(result.task));
  });

  router.patch("/:id/complete", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return sendError(res, 400, "Invalid task id.");

  const { task, forbidden } = store.findTask(id, req.userId);
  if (forbidden) return sendError(res, 403, "Not allowed to access this task.");
  if (!task) return sendError(res, 404, "Task not found.");

  const updated = store.updateTask(task, { completed: !task.completed }, req.userId);

  if (updated.error === "list_notfound") return sendError(res, 404, "List not found.");
  if (updated.error === "forbidden") return sendError(res, 403, "Not allowed to use this list.");

  res.json(taskJson(updated.task));
});

  router.get("/:id", (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return sendError(res, 400, "Invalid task id.");
    const { task, forbidden } = store.findTask(id, req.userId);
    if (forbidden) return sendError(res, 403, "Not allowed to access this task.");
    if (!task) return sendError(res, 404, "Task not found.");
    res.json(taskJson(task));
  });

  router.patch("/:id", (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return sendError(res, 400, "Invalid task id.");
    const { task, forbidden } = store.findTask(id, req.userId);
    if (forbidden) return sendError(res, 403, "Not allowed to access this task.");
    if (!task) return sendError(res, 404, "Task not found.");
    const patch = req.body || {};
    if (patch.priority != null && !PRIORITIES.has(patch.priority)) {
      return sendError(res, 400, "Invalid priority.");
    }
    const result = store.updateTask(task, patch, req.userId);
    if (result.error === "list_notfound") return sendError(res, 404, "List not found.");
    if (result.error === "forbidden") return sendError(res, 403, "Not allowed to use this list.");
    res.json(taskJson(result.task));
  });

  router.delete("/:id", (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return sendError(res, 400, "Invalid task id.");
    const { task, forbidden } = store.findTask(id, req.userId);
    if (forbidden) return sendError(res, 403, "Not allowed to access this task.");
    if (!task) return sendError(res, 404, "Task not found.");
    store.deleteTask(id, req.userId);
    res.status(204).end();
  });

  return router;
}

module.exports = { createTasksRouter };
