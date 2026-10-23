# Security policy

## The short version

Interest Ledger is a local-first interface plus Vercel Functions (`api/`) and optional Cloudflare Pages Functions (`functions/`) that forward an access token to the Meta Graph API. There is no interest database and no account system.

## Supported versions

The `main` branch is the supported version. Vercel and Cloudflare Pages deployments are built from it.

## Reporting a vulnerability

Please **do not** open a public issue for a security problem.

Use GitHub's private vulnerability reporting:

1. Go to the repository's **Security** tab.
2. Choose **Report a vulnerability**.
3. Include a description, reproduction steps, affected files or endpoints, and the impact you believe is possible.

You can also open the form directly at <https://github.com/lab1207/Meta-Interest-Finder/security/advisories/new>.

Please redact tokens, cookies, file IDs, and personal data from logs or screenshots. A minimal reproduction with synthetic data is more useful than a live secret.

This is a small project maintained on a best-effort basis. I aim to acknowledge a report within seven days and will coordinate disclosure after a fix is available.

## Scope

- token handling in the browser, Vercel Functions, or Cloudflare Pages Functions
- accidental exposure of a server token
- request handling and output encoding in `/api/interests` and `/mcp`
- dependency or build issues with a security impact

## Out of scope

- Meta Graph API permissions, rate limits, or availability
- the accuracy of audience estimates
- a token's access to a particular ad account
- issues that require a real token to reproduce but include no redacted evidence
- reports that only describe a missing server token as a vulnerability (it is the default public state)

## Safe testing

- Use a local or test deployment.
- Never test with another person's token, account, files, or private links.
- Do not run denial-of-service, spam, or resource-exhaustion tests against the live deployment.
- Stop testing if you encounter real personal data and report the exposure instead of collecting it.
