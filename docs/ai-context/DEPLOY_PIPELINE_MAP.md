# Deployment Pipeline Map

## End-to-end flow

```text
GitHub push / workflow_dispatch / repository_dispatch
  -> GitHub Actions workflow
  -> validate public config + required secrets
  -> configure SSH key + known_hosts
  -> connect to production server via SSH
  -> ensure remote directory
  -> ensure Traefik public network
  -> rsync repository source to remote
  -> render .env.production
  -> docker build on the server
  -> docker compose up -d / deploy the app container
  -> validate container HTML + healthcheck
  -> inspect Traefik routes
  -> validate the public URL through Traefik
```

## Current production workflow shape

- Workflow: `.github/workflows/production-deploy.yml`
- Trigger: push to `main`, workflow dispatch, repository dispatch
- Environment: `production`
- SSH user: `root`
- SSH port: pulled from secret/env with fallback to `22`
- Remote directory: `/opt/datavisio/visiomilhas-clean`

## Validation stages

1. Check deployment confirmation.
2. Validate presence of required secrets.
3. Configure SSH and capture the host key.
4. Create the remote directory if needed.
5. Ensure Traefik network exists.
6. Sync source to the server.
7. Render `.env.production`.
8. Build the image and start the app container.
9. Validate the container HTML and healthcheck.
10. Inspect Traefik routing.
11. Validate the public URL via the reverse proxy.

## Runtime chain

- GitHub Actions produces the deploy intent and env file.
- SSH transfers source/config to the server.
- Docker builds the image on the server.
- Docker Compose starts the application container.
- Traefik routes the public host to the application container.

## Operational note

- The workflow is also the place where runtime gates are enforced before and after deploy.
- Production should not be considered healthy until the container healthcheck and public Traefik URL both pass.
