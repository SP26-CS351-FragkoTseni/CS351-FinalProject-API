const express = require("express");
const bcrypt = require("bcryptjs");
const { sendError } = require("../errors");
const { signToken, revokeJti } = require("../authTokens");
const { requireAuth } = require("../middleware/requireAuth");

function createAuthRouter(store) {
  const router = express.Router();

  router.post("/login", async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return sendError(res, 400, "Missing email or password.");
    }
    const user = store.findUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return sendError(res, 401, "Invalid email or password.");
    }
    const { access_token } = signToken(user.id);
    res.json({ access_token, token_type: "Bearer" });
  });

  router.post("/logout", requireAuth, (req, res) => {
    revokeJti(req.tokenJti);
    res.status(204).end();
  });

  router.get("/me", requireAuth, (req, res) => {
    const u = store.findUserById(req.userId);
    if (!u) return sendError(res, 401, "Token missing or invalid.");
    res.json(store.userPublic(u));
  });

  router.patch("/me", requireAuth, async (req, res) => {
    const u = store.findUserById(req.userId);
    if (!u) return sendError(res, 401, "Token missing or invalid.");
    const { name, email, password } = req.body || {};
    if (name === undefined && email === undefined && password === undefined) {
      return sendError(res, 400, "No fields to update.");
    }
    if (email !== undefined && store.emailTakenByOther(u.id, email)) {
      return sendError(res, 400, "Email already in use.");
    }
    let passwordHash;
    if (password !== undefined) {
      if (String(password).length < 1) {
        return sendError(res, 400, "Invalid password.");
      }
      passwordHash = await bcrypt.hash(String(password), 10);
    }
    store.updateUser(u.id, {
      name: name !== undefined ? String(name) : undefined,
      email: email !== undefined ? String(email) : undefined,
      passwordHash,
    });
    res.json(store.userPublic(store.findUserById(req.userId)));
  });

  return router;
}

module.exports = { createAuthRouter };
