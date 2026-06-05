# Release Process

## Release types

### Release Candidate

- Tag format: `vX.Y.Z-rc.N` or `vX.Y.Z-beta.N`
- GitHub Release state: pre-release
- Purpose: validate the release artifact in HM before final promotion

### Production Release

- Tag format: `vX.Y.Z`
- GitHub Release state: latest release
- Purpose: promote the exact same artifact to PROD after human approval

## Required sequence

1. Build the release artifact once.
2. Deploy the artifact to HM.
3. Run HM smoke validation.
4. Run integration tests.
5. For RC: publish the GitHub pre-release and stop.
6. For Production: wait for GitHub Environment approval on `production`.
7. Deploy the same artifact to PROD.
8. Run PROD smoke validation.
9. Publish the final GitHub Release and mark it latest.

## Rules

- Never rebuild for PROD after HM approval.
- Never promote a different image or digest between HM and PROD.
- Human approval is required before PROD deploy.

