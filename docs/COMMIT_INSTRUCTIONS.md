# Git Commit Instructions

## When to Commit
When the user says "commit my changes", "commit and push", or similar.

## Pre-flight Checks

1. **Build** — `npm run build` — must succeed (both webview + extension host)
2. **Check git status** — `git status --short` — see what's changed

## Staging

1. **Stage all changed files** — `git add -A`
2. **Review the diff** — `git diff --cached --stat` — know what's going in
3. **Check for untracked files** that should be committed (new files, config, etc.)
4. **Check for files that should NOT be committed** — secrets, .env, node_modules, dist/, .vsix, IDE files. These should be in `.gitignore`

## Commit Message Format

Use a structured commit message with a **short subject line** and **categorized body**:

```
<scope>: <short summary in imperative mood>

Enhancements:
- <what was added or improved>

Dead code / cleanup:
- <what was removed and why>

Bug fixes:
- <what was broken and how it was fixed>

Other:
- <anything else worth noting>
```

### Rules for the commit message
- **Subject line**: scope + colon + short summary, lowercase, imperative mood (e.g. "add feature" not "added feature")
- **Scope**: use `webview`, `host`, `build`, `csp`, `deps`, `cleanup`, etc. — whatever fits
- **Body categories**: use `Enhancements:`, `Dead code / cleanup:`, `Bug fixes:`, `Other:` — include only categories that have items
- **Each bullet**: start with a verb (Add, Remove, Replace, Fix, Simplify, Update), be specific about what file/feature changed
- **No emojis** in commit messages

## Push

After committing:
1. `git push` — push to remote
2. Report the commit hash and branch to the user

## Example Commit Messages

Good:
```
webview: markdown rendering and CSP fixes

Enhancements:
- Add react-markdown + remark-gfm for assistant response formatting
- Add markdown styles for headings, code blocks, tables, lists
- Add connect-src to CSP for model router baseUrl

Bug fixes:
- Switch Vite build to IIFE format (fixes ES module + nonce CSP crash)
- Fix default baseUrl from port 8000 to 8001 (matches model-router)

Other:
- Extract baseUrl as DRY getter in ChatViewProvider
```

Bad (do NOT do this):
```
fixed stuff
```
```
updates
```
```
 Major improvements to the codebase!!! 
```

## Flow Summary

```
npm run build -> git add -A -> git diff --cached --stat -> commit -> push -> report
```
