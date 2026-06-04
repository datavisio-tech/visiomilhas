---
name: runtime-deploy-forensics
description: |
  Diagnose production white screens, React hydration failures, React #418/#423,
  HierarchyRequestError, NotFoundError, and missing document.doctype before
  investigating React components.
triggers:
  - "runtime deploy forensics"
  - "React #418"
  - "React #423"
  - "HierarchyRequestError"
  - "NotFoundError"
  - "document.doctype"
  - "white screen"
  - "tela branca"
  - "hydration failure"
od:
  mode: incident-response
  category: runtime-deploy
  upstream: "local"
---

# runtime-deploy-forensics

## What it does

Guides agents through production runtime forensics for UI blank-screen and hydration incidents. It prioritizes deploy artifact, HTML validity, container state, and proxy routing before React component debugging.

## When to use

Use this skill immediately when any of the following appear:

- Tela branca after page load.
- `React #418`.
- `React #423`.
- `HierarchyRequestError`.
- `NotFoundError`.
- `document.doctype = null`.
- Raw HTML starts with `<meta ...` instead of `<!DOCTYPE html>`.

## Mandatory Order

Do not start with frontend component investigation. Follow this sequence:

1. Runtime Forensics.
2. HTML Validation.
3. Container Validation.
4. Deploy Validation.
5. Proxy/Routing Validation.
6. Browser Hydration Validation.
7. Frontend Investigation only if all runtime layers are valid.

## Runtime Forensics Checklist

### 1. Capture Raw HTML

For each affected route:

- Fetch the URL with redirects controlled.
- Record status code.
- Record redirect target, if any.
- Capture the first 500 characters.
- Confirm whether it starts with `<!DOCTYPE html>`.

If the HTML starts with `<meta ...`, treat it as a runtime/document shell issue until proven otherwise.

### 2. Validate Browser Document

Use DevTools, Chrome/CDP, or equivalent to capture:

- `document.doctype`.
- `document.body.innerText.length`.
- `document.body.children.length`.
- Console exceptions.

Block release closure if any of these remain:

- `React #418`.
- `React #423`.
- `HierarchyRequestError`.
- `NotFoundError`.

### 3. Identify Active Container

Collect:

- `docker ps`.
- Container name.
- Image tag.
- Image ID.
- Container creation time.
- Health status.

Do not assume the latest build is active.

### 4. Inspect Container and Image

Run `docker inspect` and record:

- `Config.WorkingDir`.
- `Config.Image`.
- `Config.Healthcheck`.
- Relevant labels.
- Image creation time.

For Next.js App Router projects with `app/` and nested `app/app/`, flag `WORKDIR /app` as a collision risk.

### 5. Validate HTML Inside the Container

Call the app inside the container or via its internal network address before Traefik:

- If HTML is invalid inside the container, the proxy is not the root cause.
- If HTML is valid inside the container but invalid publicly, investigate proxy/cache/routing.

### 6. Validate Deploy Provenance

Collect:

- Workflow name.
- Workflow run ID.
- Commit SHA.
- Image tag/SHA.
- Deploy time.
- Success/failure conclusion.

Compare these with the active container image.

### 7. Validate Traefik or Proxy

Collect:

- Router name.
- Router rule.
- Service name.
- Backend server URL.
- Server status.
- Container labels.

Confirm the public domain points to the expected container.

## Known Incident: VisioMilhas KB-0001

The VisioMilhas production incident on 2026-06-02 was caused by:

```dockerfile
WORKDIR /app
```

in a Next.js App Router project containing:

```txt
app/
app/app/
```

The fix was:

```dockerfile
WORKDIR /workspace
```

with all derived paths updated.

Reference:

- `docs/ai-context/knowledge-base/KB-0001-DOCKER-WORKDIR-APP-ROUTER-COLLISION.md`

## Decision Rule

If `React #418` or `React #423` appears together with missing `DOCTYPE`, prioritize runtime/deploy/container validation over React component changes.

Only investigate components after proving:

- Raw HTML has `<!DOCTYPE html>`.
- `document.doctype` is present.
- Active container is the expected image.
- Deploy SHA matches the intended release.
- Proxy routes to the expected backend.
