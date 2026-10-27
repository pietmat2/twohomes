-- The Twohomes relay's storage: families and their sealed operations.
--
-- Everything lives in a private schema that the Data API doesn't expose, with
-- row-level security on and no policies, so the anon and authenticated roles
-- can't reach it by any route. Only the relay Edge Function, connecting as
-- the database owner, reads and writes it. Nothing here is readable: `body`
-- is ciphertext, and `token_hash` is a SHA-256 of a token derived from a
-- secret the server never sees.

create schema if not exists relay;
revoke all on schema relay from public, anon, authenticated;

create table relay.families (
  id text primary key check (id ~ '^[A-Za-z0-9_-]{16,64}$'),
  token_hash text not null check (token_hash ~ '^[0-9a-f]{64}$'),
  devices text[] not null default '{}',
  seq bigint not null default 0,
  bytes bigint not null default 0,
  created_at timestamptz not null default now()
);

create table relay.ops (
  family_id text not null references relay.families (id) on delete cascade,
  seq bigint not null,
  device text not null,
  body text not null,
  created_at timestamptz not null default now(),
  primary key (family_id, seq)
);

alter table relay.families enable row level security;
alter table relay.ops enable row level security;
revoke all on all tables in schema relay from public, anon, authenticated;
