-- Owner key: sha256 of LAWN_WRITE_SECRET (the server-only secret in Vercel).
-- Safe to commit: the secret is 32 random bytes, so its hash can't be reversed.
-- To rotate: set a new LAWN_WRITE_SECRET in Vercel and add a migration with its hash.
insert into private.owner (id, secret_sha256)
values (1, 'fbf5ecc5e71149fa282c2870e53c02d5c8e785b430c6f05ac106a3365fe3a84e')
on conflict (id) do update set secret_sha256 = excluded.secret_sha256;
