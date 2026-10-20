CREATE TABLE IF NOT EXISTS administrators (
  username TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL
);

-- A revisão impede que duas telas sobrescrevam alterações uma da outra.
CREATE TABLE IF NOT EXISTS inventory (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  revision INTEGER NOT NULL DEFAULT 0,
  data JSONB NOT NULL DEFAULT '{"items":[],"history":[]}'::jsonb
);
INSERT INTO inventory (id) VALUES (1) ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS admin_sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS admin_sessions_expire_idx ON admin_sessions (expire);
