CREATE TABLE IF NOT EXISTS devices (
 token_hash TEXT PRIMARY KEY,
 endpoint_hash TEXT NOT NULL UNIQUE,
 subscription TEXT NOT NULL,
 topics TEXT NOT NULL,
 frequency TEXT NOT NULL CHECK(frequency IN ('daily','few')),
 hour INTEGER NOT NULL,
 timezone TEXT NOT NULL,
 next_at INTEGER NOT NULL,
 test_at INTEGER,
 last_test INTEGER NOT NULL DEFAULT 0,
 sent TEXT NOT NULL DEFAULT '[]',
 last_status TEXT NOT NULL DEFAULT 'registered',
 updated_at INTEGER NOT NULL,
 expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS devices_due ON devices(next_at);
CREATE INDEX IF NOT EXISTS devices_test ON devices(test_at);
CREATE INDEX IF NOT EXISTS devices_expiry ON devices(expires_at);
