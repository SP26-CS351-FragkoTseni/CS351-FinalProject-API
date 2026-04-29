const bcrypt = require("bcryptjs");

function nowIso() {
  return new Date().toISOString();
}

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    name: row.name,
  };
}

function mapList(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    created_at: row.created_at,
  };
}

function mapTask(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    due_date: row.due_date,
    priority: row.priority,
    completed: Boolean(row.completed),
    list_id: row.list_id,
    created_at: row.created_at,
  };
}

function mapReminder(row) {
  if (!row) return null;
  return {
    id: row.id,
    taskId: row.task_id,
    remind_at: row.remind_at,
    delivery_method: row.delivery_method,
    created_at: row.created_at,
  };
}

class Store {
  /** @param {import('better-sqlite3').Database} db */
  constructor(db) {
    this.db = db;
  }

  async seed() {
    const count = this.db.prepare("SELECT COUNT(*) AS c FROM users").get().c;
    if (count > 0) return;
    const passwordHash = await bcrypt.hash("secret", 10);
    const ins = this.db.prepare(
      "INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)"
    );
    ins.run("student@example.com", passwordHash, "Example Student");
    ins.run("other@example.com", passwordHash, "Other User");
  }

  findUserByEmail(email) {
    const row = this.db
      .prepare("SELECT * FROM users WHERE lower(email) = lower(?)")
      .get(String(email));
    return mapUser(row);
  }

  /** True if another user (not excludeUserId) already has this email. */
  emailTakenByOther(excludeUserId, email) {
    const row = this.db
      .prepare(
        "SELECT id FROM users WHERE lower(email) = lower(?) AND id != ?"
      )
      .get(String(email), excludeUserId);
    return Boolean(row);
  }

  findUserById(id) {
    const row = this.db.prepare("SELECT * FROM users WHERE id = ?").get(id);
    return mapUser(row);
  }

  userPublic(u) {
    return { id: u.id, email: u.email, name: u.name };
  }

  updateUser(userId, { name, email, passwordHash }) {
    const u = this.findUserById(userId);
    if (!u) return null;
    const sets = [];
    const vals = [];
    if (name !== undefined) {
      sets.push("name = ?");
      vals.push(name);
    }
    if (email !== undefined) {
      sets.push("email = ?");
      vals.push(email);
    }
    if (passwordHash !== undefined) {
      sets.push("password_hash = ?");
      vals.push(passwordHash);
    }
    if (sets.length) {
      vals.push(userId);
      this.db
        .prepare(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`)
        .run(...vals);
    }
    return this.findUserById(userId);
  }

  listsForUser(userId) {
    return this.db
      .prepare("SELECT * FROM lists WHERE user_id = ? ORDER BY id")
      .all(userId)
      .map(mapList);
  }

  findList(id, userId) {
    const row = this.db.prepare("SELECT * FROM lists WHERE id = ?").get(id);
    if (!row) return { list: null, forbidden: false };
    const list = mapList(row);
    if (list.userId !== userId) return { list: null, forbidden: true };
    return { list, forbidden: false };
  }

  createList(userId, name) {
    const created_at = nowIso();
    const info = this.db
      .prepare(
        "INSERT INTO lists (user_id, name, created_at) VALUES (?, ?, ?)"
      )
      .run(userId, String(name), created_at);
    return mapList(
      this.db.prepare("SELECT * FROM lists WHERE id = ?").get(info.lastInsertRowid)
    );
  }

  renameList(listId, name) {
    this.db.prepare("UPDATE lists SET name = ? WHERE id = ?").run(
      String(name),
      listId
    );
    return mapList(this.db.prepare("SELECT * FROM lists WHERE id = ?").get(listId));
  }

  updateList(list, patch) {
    if (patch.name !== undefined) {
      return this.renameList(list.id, patch.name);
    }
    return mapList(this.db.prepare("SELECT * FROM lists WHERE id = ?").get(list.id));
  }

  deleteList(id, userId) {
    const info = this.db
      .prepare("DELETE FROM lists WHERE id = ? AND user_id = ?")
      .run(id, userId);
    return info.changes > 0;
  }

  tasksForUser(userId, filters) {
    const where = ["user_id = ?"];
    const params = [userId];
    if (filters.status === "pending") where.push("completed = 0");
    if (filters.status === "completed") where.push("completed = 1");
    if (filters.priority) {
      where.push("priority = ?");
      params.push(filters.priority);
    }
    if (filters.list_id != null && filters.list_id !== "") {
      where.push("list_id = ?");
      params.push(Number(filters.list_id));
    }
    if (filters.due_before) {
      where.push("due_date IS NOT NULL AND datetime(due_date) <= datetime(?)");
      params.push(String(filters.due_before));
    }
    if (filters.due_after) {
      where.push("due_date IS NOT NULL AND datetime(due_date) >= datetime(?)");
      params.push(String(filters.due_after));
    }
    const sql = `SELECT * FROM tasks WHERE ${where.join(" AND ")} ORDER BY id`;
    return this.db.prepare(sql).all(...params).map(mapTask);
  }

  tasksInList(listId, userId) {
    const { list, forbidden } = this.findList(listId, userId);
    if (forbidden) return { error: "forbidden" };
    if (!list) return { error: "notfound" };
    const rows = this.db
      .prepare(
        "SELECT * FROM tasks WHERE user_id = ? AND list_id = ? ORDER BY id"
      )
      .all(userId, listId)
      .map(mapTask);
    return { tasks: rows };
  }

  findTask(id, userId) {
    const row = this.db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
    if (!row) return { task: null, forbidden: false };
    const task = mapTask(row);
    if (task.userId !== userId) return { task: null, forbidden: true };
    return { task, forbidden: false };
  }

  createTask(userId, body) {
    const list_id =
      body.list_id != null && body.list_id !== ""
        ? Number(body.list_id)
        : null;
    if (list_id) {
      const { list, forbidden } = this.findList(list_id, userId);
      if (!list) return { error: forbidden ? "forbidden" : "list_notfound" };
    }
    const created_at = nowIso();
    const info = this.db
      .prepare(
        `INSERT INTO tasks (user_id, title, due_date, priority, completed, list_id, created_at)
         VALUES (?, ?, ?, ?, 0, ?, ?)`
      )
      .run(
        userId,
        String(body.title),
        body.due_date != null ? String(body.due_date) : null,
        body.priority || "medium",
        list_id,
        created_at
      );
    const task = mapTask(
      this.db.prepare("SELECT * FROM tasks WHERE id = ?").get(info.lastInsertRowid)
    );
    return { task };
  }

  updateTask(task, patch, userId) {
    if (patch.list_id !== undefined) {
      if (patch.list_id === null) {
        this.db.prepare("UPDATE tasks SET list_id = NULL WHERE id = ?").run(task.id);
      } else {
        const lid = Number(patch.list_id);
        const { list, forbidden } = this.findList(lid, userId);
        if (!list) return { error: forbidden ? "forbidden" : "list_notfound" };
        this.db.prepare("UPDATE tasks SET list_id = ? WHERE id = ?").run(lid, task.id);
      }
    }
    const sets = [];
    const vals = [];
    if (patch.title !== undefined) {
      sets.push("title = ?");
      vals.push(String(patch.title));
    }
    if (patch.due_date !== undefined) {
      sets.push("due_date = ?");
      vals.push(patch.due_date === null ? null : String(patch.due_date));
    }
    if (patch.priority !== undefined) {
      sets.push("priority = ?");
      vals.push(patch.priority);
    }
    if (patch.completed !== undefined) {
      sets.push("completed = ?");
      vals.push(patch.completed ? 1 : 0);
    }
    if (sets.length) {
      vals.push(task.id);
      this.db
        .prepare(`UPDATE tasks SET ${sets.join(", ")} WHERE id = ?`)
        .run(...vals);
    }
    const updated = mapTask(
      this.db.prepare("SELECT * FROM tasks WHERE id = ?").get(task.id)
    );
    return { task: updated };
  }

  deleteTask(id, userId) {
    const info = this.db
      .prepare("DELETE FROM tasks WHERE id = ? AND user_id = ?")
      .run(id, userId);
    return info.changes > 0;
  }

  remindersForTask(taskId, userId) {
    const { task, forbidden } = this.findTask(taskId, userId);
    if (forbidden) return { error: "forbidden" };
    if (!task) return { error: "notfound" };
    const reminders = this.db
      .prepare("SELECT * FROM reminders WHERE task_id = ? ORDER BY id")
      .all(taskId)
      .map(mapReminder);
    return { reminders };
  }

  createReminder(taskId, userId, body) {
    const { task, forbidden } = this.findTask(taskId, userId);
    if (forbidden) return { error: "forbidden" };
    if (!task) return { error: "notfound" };
    const created_at = nowIso();
    const info = this.db
      .prepare(
        `INSERT INTO reminders (task_id, remind_at, delivery_method, created_at)
         VALUES (?, ?, ?, ?)`
      )
      .run(
        taskId,
        String(body.remind_at),
        String(body.delivery_method || "email"),
        created_at
      );
    const reminder = mapReminder(
      this.db.prepare("SELECT * FROM reminders WHERE id = ?").get(info.lastInsertRowid)
    );
    return { reminder };
  }

  findReminder(reminderId, taskId, userId) {
    const { task, forbidden } = this.findTask(taskId, userId);
    if (forbidden) return { reminder: null, forbidden: true };
    if (!task) return { reminder: null, forbidden: false };
    const row = this.db
      .prepare("SELECT * FROM reminders WHERE id = ? AND task_id = ?")
      .get(reminderId, taskId);
    return { reminder: mapReminder(row), forbidden: false };
  }

  updateReminder(reminder, patch) {
    const sets = [];
    const vals = [];
    if (patch.remind_at !== undefined) {
      sets.push("remind_at = ?");
      vals.push(String(patch.remind_at));
    }
    if (patch.delivery_method !== undefined) {
      sets.push("delivery_method = ?");
      vals.push(String(patch.delivery_method));
    }
    if (sets.length) {
      vals.push(reminder.id);
      this.db
        .prepare(`UPDATE reminders SET ${sets.join(", ")} WHERE id = ?`)
        .run(...vals);
    }
    return mapReminder(
      this.db.prepare("SELECT * FROM reminders WHERE id = ?").get(reminder.id)
    );
  }

  deleteReminder(reminderId, taskId, userId) {
    const { reminder, forbidden } = this.findReminder(reminderId, taskId, userId);
    if (forbidden) return "forbidden";
    if (!reminder) return "notfound";
    this.db.prepare("DELETE FROM reminders WHERE id = ?").run(reminderId);
    return "ok";
  }
}

module.exports = { Store, nowIso };
