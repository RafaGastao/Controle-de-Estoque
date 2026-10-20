import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import pg from "pg";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { validateInventory } from "./validation.js";

export function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

export function checkPassword(password, hash) {
  const [salt, expected] = hash.split(":");
  const actual = scryptSync(password, salt, 64);
  const stored = Buffer.from(expected, "hex");
  return actual.length === stored.length && timingSafeEqual(actual, stored);
}

export async function initialize(pool, username, password) {
  await pool.query(
    await readFile(new URL("./database.sql", import.meta.url), "utf8"),
  );
  // Somente a configuração do servidor pode definir o administrador.
  await pool.query(
    `INSERT INTO administrators (username,password_hash) VALUES ($1,$2)
    ON CONFLICT (username) DO UPDATE SET password_hash=EXCLUDED.password_hash`,
    [username, hashPassword(password)],
  );
  await pool.query("DELETE FROM administrators WHERE username <> $1", [
    username,
  ]);
}

export function createApp({ pool, secret, production = false, store }) {
  const app = express();
  if (production) app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(express.json({ limit: "5mb" }));
  const PgStore = connectPgSimple(session);
  app.use(
    session({
      name: "casa.sid",
      secret,
      resave: false,
      saveUninitialized: false,
      store: store || new PgStore({ pool, tableName: "admin_sessions" }),
      cookie: {
        httpOnly: true,
        secure: production,
        sameSite: "strict",
        maxAge: 8 * 60 * 60 * 1000,
      },
    }),
  );
  app.use("/api", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    if (["POST", "PUT", "DELETE", "PATCH"].includes(req.method)) {
      // Uma página de outro domínio não pode enviar alterações autenticadas.
      const origin = req.get("origin");
      if (
        (origin && origin !== `${req.protocol}://${req.get("host")}`) ||
        req.get("sec-fetch-site") === "cross-site"
      ) {
        return res.status(403).json({ error: "Origem não autorizada." });
      }
      if (!req.is("application/json"))
        return res.status(415).json({ error: "Envie JSON." });
    }
    next();
  });
  app.get("/health", async (req, res) => {
    await pool.query("SELECT 1");
    res.json({ status: "ok" });
  });
  app.post(
    "/api/login",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 10,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: { error: "Muitas tentativas. Aguarde 15 minutos." },
    }),
    async (req, res, next) => {
      try {
        const { username, password } = req.body || {};
        if (
          typeof username !== "string" ||
          typeof password !== "string" ||
          username.length > 80 ||
          password.length > 256
        )
          return res
            .status(400)
            .json({ error: "Informe usuário e senha válidos." });
        const result = await pool.query(
          "SELECT password_hash FROM administrators WHERE username=$1",
          [username],
        );
        const fallback = hashPassword(
          "invalid-password",
          "00000000000000000000000000000000",
        );
        const valid = checkPassword(
          password,
          result.rows[0]?.password_hash || fallback,
        );
        if (!valid || !result.rows.length)
          return res
            .status(401)
            .json({ error: "Usuário ou senha incorretos." });
        req.session.regenerate((err) => {
          if (err) return next(err);
          req.session.username = username;
          req.session.save((error) =>
            error ? next(error) : res.json({ username }),
          );
        });
      } catch (error) {
        next(error);
      }
    },
  );
  app.use("/api", async (req, res, next) => {
    if (!req.session.username)
      return res.status(401).json({ error: "Entre para continuar." });
    const result = await pool.query(
      "SELECT username FROM administrators WHERE username=$1",
      [req.session.username],
    );
    if (!result.rows.length)
      return res.status(401).json({ error: "Acesso encerrado." });
    next();
  });
  app.get("/api/me", (req, res) =>
    res.json({ username: req.session.username }),
  );
  app.post("/api/logout", (req, res, next) => {
    req.session.destroy((error) => {
      if (error) return next(error);
      res.clearCookie("casa.sid", {
        httpOnly: true,
        secure: production,
        sameSite: "strict",
      });
      res.json({ ok: true });
    });
  });
  app.get("/api/inventory", async (req, res) => {
    const result = await pool.query(
      "SELECT data, revision FROM inventory WHERE id=1",
    );
    res.json(result.rows[0]);
  });
  app.put("/api/inventory", async (req, res) => {
    let data;
    try {
      data = validateInventory(req.body?.data);
      if (!Number.isInteger(req.body.revision) || req.body.revision < 0)
        throw Error("Revisão inválida.");
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
    // Atualização atômica: um saldo lido antes de outra alteração não é aceito.
    const result = await pool.query(
      "UPDATE inventory SET data=$1::jsonb, revision=revision+1 WHERE id=1 AND revision=$2 RETURNING data,revision",
      [JSON.stringify(data), req.body.revision],
    );
    if (!result.rows.length)
      return res
        .status(409)
        .json({
          error:
            "O estoque mudou em outra tela. Os dados foram atualizados; refaça a operação.",
        });
    res.json(result.rows[0]);
  });
  const root = fileURLToPath(new URL(".", import.meta.url));
  app.get("/", (req, res) =>
    res.redirect(req.session.username ? "/index.html" : "/login.html"),
  );
  app.get("/index.html", (req, res) =>
    req.session.username
      ? res.sendFile(root + "index.html")
      : res.redirect("/login.html"),
  );
  for (const file of ["login.html", "login.js", "app.js", "style.css"]) {
    app.get("/" + file, (req, res) => res.sendFile(root + file));
  }
  app.use((req, res) =>
    res.status(404).json({ error: "Página não encontrada." }),
  );
  app.use((error, req, res, next) => {
    console.error("Falha na requisição:", error.code || error.name);
    res
      .status(error.status === 413 ? 413 : 500)
      .json({
        error:
          error.status === 413
            ? "Backup muito grande (máximo 5 MB)."
            : "Não foi possível concluir. Tente novamente.",
      });
  });
  return app;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { DATABASE_URL, SESSION_SECRET } = process.env;
  // Acesso fixo do administrador, conforme definido para este restaurante.
  const ADMIN_USERNAME = "admin";
  const ADMIN_PASSWORD = "CasaMadeira@2026!";
  if (
    !DATABASE_URL ||
    !SESSION_SECRET ||
    SESSION_SECRET.length < 32 ||
    !ADMIN_PASSWORD ||
    ADMIN_PASSWORD.length < 12 ||
    ADMIN_PASSWORD.length > 256 ||
    !ADMIN_USERNAME.trim() ||
    ADMIN_USERNAME.length > 80
  ) {
    throw Error(
      "Configure DATABASE_URL e SESSION_SECRET (32+ caracteres).",
    );
  }
  const pool = new pg.Pool({
    connectionString: DATABASE_URL,
    max: 10,
    connectionTimeoutMillis: 10000,
  });
  await initialize(pool, ADMIN_USERNAME, ADMIN_PASSWORD);
  const server = createApp({
    pool,
    secret: SESSION_SECRET,
    production: process.env.NODE_ENV === "production",
  }).listen(process.env.PORT || 3000, "0.0.0.0", () =>
    console.log("Controle de estoque iniciado."),
  );
  process.on("SIGTERM", () =>
    server.close(async () => {
      await pool.end();
      process.exit(0);
    }),
  );
}
