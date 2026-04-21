const express = require("express");
const { openDatabase } = require("./db");
const { Store } = require("./store");
const { createAuthRouter } = require("./routes/auth");
const { createTasksRouter } = require("./routes/tasks");
const { createRemindersRouter } = require("./routes/reminders");
const { createListsRouter } = require("./routes/lists");

async function createApp() {
  const db = openDatabase();
  const store = new Store(db);
  await store.seed();

  const app = express();
  app.use(express.json());

  const v1 = express.Router();
  v1.use("/auth", createAuthRouter(store));
  v1.use("/tasks/:taskId/reminders", createRemindersRouter(store));
  v1.use("/tasks", createTasksRouter(store));
  v1.use("/lists", createListsRouter(store));

  app.use("/v1", v1);

  app.use((req, res) => {
    res.status(404).json({
      error: { code: 404, message: "Not found." },
    });
  });

  return { app, store, db };
}

module.exports = { createApp };
