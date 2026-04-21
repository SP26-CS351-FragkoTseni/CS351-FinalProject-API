const express = require("express");
const { sendError } = require("../errors");
const { requireAuth } = require("../middleware/requireAuth");

function listJson(l) {
  return {
    id: l.id,
    name: l.name,
    created_at: l.created_at,
  };
}

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

function createListsRouter(store) {
  const router = express.Router();
  router.use(requireAuth);

  router.get("/", (req, res) => {
    res.json(store.listsForUser(req.userId).map(listJson));
  });

  router.post("/", (req, res) => {
    const { name } = req.body || {};
    if (!name || typeof name !== "string") {
      return sendError(res, 400, "Missing or invalid name.");
    }
    const row = store.createList(req.userId, name);
    res.status(201).json(listJson(row));
  });

  router.get("/:id/tasks", (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return sendError(res, 400, "Invalid list id.");
    const out = store.tasksInList(id, req.userId);
    if (out.error === "forbidden") return sendError(res, 403, "Not allowed to access this list.");
    if (out.error === "notfound") return sendError(res, 404, "List not found.");
    res.json(out.tasks.map(taskJson));
  });

  router.patch("/:id", (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return sendError(res, 400, "Invalid list id.");
    const { list, forbidden } = store.findList(id, req.userId);
    if (forbidden) return sendError(res, 403, "Not allowed to access this list.");
    if (!list) return sendError(res, 404, "List not found.");
    const patch = req.body || {};
    if (patch.name === undefined) {
      return sendError(res, 400, "No fields to update.");
    }
    const updated = store.updateList(list, patch);
    res.json(listJson(updated));
  });

  router.delete("/:id", (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return sendError(res, 400, "Invalid list id.");
    const { list, forbidden } = store.findList(id, req.userId);
    if (forbidden) return sendError(res, 403, "Not allowed to access this list.");
    if (!list) return sendError(res, 404, "List not found.");
    store.deleteList(id, req.userId);
    res.status(204).end();
  });

  return router;
}

module.exports = { createListsRouter };
