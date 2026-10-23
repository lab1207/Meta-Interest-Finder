# Contributing to Interest Ledger

Thanks for taking the time to improve Interest Ledger.

## What fits

- Bug fixes and small, focused improvements
- Accessibility, responsive-layout, and keyboard fixes
- Documentation corrections or clearer setup notes
- Privacy or security hardening that keeps the existing behavior honest

Open an issue before a large feature or a redesign so the shape can be discussed first.

## Local setup

```bash
npm ci
```

For `/api/*` and `/mcp`, run `npm run build` and then `npx wrangler pages dev dist`. Do not put a real `META_TOKEN` in a tracked file.

## Checks

```bash
npm ci
npm run build
```

## Before a pull request

- Keep the public surfaces under the neutral `lab1207` identity and free of personal data.
- Do not commit tokens, private keys, `.dev.vars`, `.env` files, real user files, or screenshots that contain any of those.
- Do not add fake data, fake AI output, or a fixture that is presented as a live result.
- Match the existing TypeScript, CSS, and naming patterns; keep changes as small as the problem allows.
- Update the README if behavior, setup, or a limitation changes.

## Commit and pull request style

Write a short, specific commit subject. In the pull request, explain what changed, why, and how it was checked. Include a screenshot for visible UI changes.

## Security

Please do not open a public issue for a security problem. Use the private reporting path in [SECURITY.md](SECURITY.md).

## License

By contributing, you agree that your contribution is licensed under GPL-3.0-or-later, the same license as this project.
