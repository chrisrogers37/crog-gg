# Security Policy

## Reporting a vulnerability

Please report security issues privately: open this repository's **Security** tab and choose **Report a vulnerability**. Don't open a public issue for anything exploitable.

This is a personal project, so there's no bug bounty, but reports are read and acknowledged.

## Scope

In scope:

- The live site at https://crog.gg and its API under `/api/*`.
- The code and GitHub Actions workflows in this repository.

Especially useful:

- Ways to spend the site's OpenAI budget beyond the per-visitor limits on `/api/regenerate`.
- Ways to read private data through the GitHub proxy (`/api/v1/github/*`).
- Anything that exposes secrets, tokens or environment variables.

Out of scope:

- Volume or denial-of-service testing. Please don't load-test the live site or send large numbers of requests to `/api/regenerate`: it spends real money.
- Findings that need an already-compromised device or browser.

## Supported versions

Only the `main` branch, which is what's deployed at crog.gg, gets security fixes.
