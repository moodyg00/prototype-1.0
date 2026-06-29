# sites/

Editable static website projects for **apps/public-dev**. Preview at `/preview/<slug>/`; deploy copies to `apps/public-site/` locally (or `public_html` on the server).

```
sites/
  <slug>/
    .project.json     # name, deploy target, optional per-project overrides
    index.html
    css/ js/ images/ ...
    .deploy-ignore     # optional patterns excluded from deploy
```

- Plain **HTML/CSS/JS only** — no build step.
- `<slug>`: lowercase letters, numbers, hyphens.
