const express = require("express");
const { sendError } = require("../errors");
const { requireAuth } = require("../middleware/requireAuth");

function reminderJson(r) {
  return {
    id: r.id,
    task_id: r.taskId,
    remind_at: r.remind_at,
    delivery_method: r.delivery_method,
    created_at: r.created_at,
  };
}

function createRemindersRouter(store) {
  const router = express.Router({ mergeParams: true });
  router.use(requireAuth);

  router.get("/", (req, res) => {
    const taskId = Number(req.params.taskId);
    if (!Number.isInteger(taskId)) return sendError(res, 400, "Invalid task id.");
    const out = store.remindersForTask(taskId, req.userId);
    if (out.error === "forbidden") return sendError(res, 403, "Not allowed to access this task.");
    if (out.error === "notfound") return sendError(res, 404, "Task not found.");
    res.json(out.reminders.map(reminderJson));
  });

  router.post("/", (req, res) => {
    const taskId = Number(req.params.taskId);
    if (!Number.isInteger(taskId)) return sendError(res, 400, "Invalid task id.");
    const { remind_at, delivery_method } = req.body || {};
    if (!remind_at) return sendError(res, 400, "Missing remind_at.");
    const out = store.createReminder(taskId, req.userId, { remind_at, delivery_method });
    if (out.error === "forbidden") return sendError(res, 403, "Not allowed to access this task.");
    if (out.error === "notfound") return sendError(res, 404, "Task not found.");
    res.status(201).json(reminderJson(out.reminder));
  });

  router.patch("/:id", (req, res) => {
    const taskId = Number(req.params.taskId);
    const id = Number(req.params.id);
    if (!Number.isInteger(taskId) || !Number.isInteger(id)) {
      return sendError(res, 400, "Invalid id.");
    }
    const { reminder, forbidden } = store.findReminder(id, taskId, req.userId);
    if (forbidden) return sendError(res, 403, "Not allowed to access this task.");
    if (!reminder) return sendError(res, 404, "Reminder not found.");
    const patch = req.body || {};
    if (patch.remind_at === undefined && patch.delivery_method === undefined) {
      return sendError(res, 400, "No fields to update.");
    }
    const updated = store.updateReminder(reminder, patch);
    res.json(reminderJson(updated));
  });

  router.delete("/:id", (req, res) => {
    const taskId = Number(req.params.taskId);
    const id = Number(req.params.id);
    if (!Number.isInteger(taskId) || !Number.isInteger(id)) {
      return sendError(res, 400, "Invalid id.");
    }
    const result = store.deleteReminder(id, taskId, req.userId);
    if (result === "forbidden") return sendError(res, 403, "Not allowed to access this task.");
    if (result === "notfound") return sendError(res, 404, "Reminder not found.");
    res.status(204).end();
  });

  return router;
}

module.exports = { createRemindersRouter };
