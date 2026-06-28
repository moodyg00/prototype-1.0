# sites/

Each subfolder is a standalone static website project edited by **apps/public-dev**.

```
sites/
  <slug>/
    .project.json     # project metadata (name, deploy target)
    index.html
    css/ js/ images/ ...
    .deploy-ignore     # optional, gitignore-style patterns excluded from deploy
```

- Projects contain **plain HTML/CSS/JS only** — no build step.
- `<slug>` must be lowercase letters, numbers, and hyphens.
- Deploys push the project's contents to the configured remote docroot via SSH/SFTP.
