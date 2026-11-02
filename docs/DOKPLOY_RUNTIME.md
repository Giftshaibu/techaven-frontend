# Dokploy container runtime

Implementation prepared 31 October 2026 before validation, as requested.

The Dockerfile builds a standalone Node/Nitro server, runs as user node on port 3001, and excludes .env, Git metadata and local build/dependency directories. It does not package seeded databases or uploaded files.

Runtime environment:

- `TECHAVEN_API_URL=http://techaven-backend:8000` for SSR and same-origin `/api/*` and `/uploads/*` forwarding.
- `PROMOTIONS_API_URL=http://techaven-cms:1337` for SSR and same-origin `/cms/*` forwarding.
- `HOST=0.0.0.0`, `PORT=3001`, `NODE_ENV=production` are image defaults.

No production domains are compiled into this image. Set the two internal service origins in Dokploy at runtime; browser commerce requests remain same-origin, and CMS requests use `/cms` when no explicit public build-time URL was supplied. Existing Lovable/Cloudflare builds retain their default preset; Docker explicitly supplies `NITRO_PRESET=node_server`.

Image: `gshaibu/techaven-frontend:20261031` (`latest` is the convenience alias). Health endpoint: `/healthz`. Configure the storefront HTTPS domain against container port 3001.

The full three-service Compose template, database/upload export, restore order, runtime secrets and public media-origin rewrite instructions live in the backend repository: `deploy/dokploy.compose.yml` and `docs/DOKPLOY_DEPLOYMENT.md`. Image smoke-test/publication results are recorded there after implementation is finished. Retained Supabase scaffolding is not required by the current commerce flows; any enabled Supabase feature still requires its own configuration.

Validation on 2 November 2026: all 55 frontend tests pass. The Node image is healthy; storefront, catalogue/shop pages, commerce forwarding (19 shops) and CMS forwarding returned HTTP 200. Both Docker Hub tags were verified against registry digest sha256:19535f45d03abd8e8ad05e9dea1d993ed0bf3ddfebe345a26a1c59fc21e92543.
