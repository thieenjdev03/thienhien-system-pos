## Snapshot sync (Dexie ↔ Prisma)

This project supports **manual, full-snapshot sync** between:

- **Local**: Dexie / IndexedDB (client)
- **Server**: Prisma / PostgreSQL

The sync is **destructive** (Replace All) in both directions:

- **Push**: local → server, replaces ALL server data (users, products, customers, invoices, invoice items, counters)
- **Pull**: server → local, replaces ALL local IndexedDB data

### Security

Sync is protected by a server token:

- **Env var**: `SYNC_TOKEN`
- **Header**: `x-sync-token: <SYNC_TOKEN>`

If `SYNC_TOKEN` is missing on the server, `/api/sync` will return `500`.

### Endpoints

- **GET** ` /api/sync`
  - Returns a `BackupPayload` (v2)
  - Requires header `x-sync-token`

- **POST** ` /api/sync`
  - Body: `BackupPayload` (v2)
  - Replaces ALL server data in a single transaction
  - Requires header `x-sync-token`

### Payload format

Sync uses the same backup contract used by local backup/restore, with **v2 including `users`**:

- `meta.version`: `2` (push requires v2)
- `data.users`: included (PIN hashes are part of the snapshot)

### UI (recommended)

There is a dashboard page at:

- `/settings/sync`

It lets you paste the token, then run:

- **Push local → server (replace all)**
- **Pull server → local (replace all)**

Both actions show counts and require confirmations.

### Operational notes

- **Do not run sync on multiple clients at the same time** (last writer wins).
- Push/Pull are intended for **backup/restore** and **migration support**, not continuous realtime sync.
- Large payloads: server enforces a push size limit (see `app/api/sync/route.ts`).

