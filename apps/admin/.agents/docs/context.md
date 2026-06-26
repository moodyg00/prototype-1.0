# Business & Product Context

## Vision

A complete business suite where founders (human + AI agent team) start, operate, and scale any type of business.

## Core value

- Humans focus on strategy and high-level decisions
- Agents handle execution, research, content, operations, and iteration
- Single source of truth: shared Postgres (`@prototype/db`) across admin and agent apps

## Monorepo apps

| App | Role |
|-----|------|
| **Admin** | CRUD, accounting, billing, banking, scheduling, settings |
| **Agent** | App Lab — workspaces, browser automation, workflows |
| **Worker** | Scheduled jobs (cron → admin API) |
| **Public site** | Static marketing (`dev/` → `live/`) |

## Target users

- Solo founders / small teams
- Agencies running multiple client businesses
- AI-first startups wanting deep agent collaboration

## Key differentiator

The agent app is not a simple dashboard — it is a workspace OS with browser tools, workflows, and LangGraph compilation, sharing the same database as admin.

## Success metrics

- Time from idea to first revenue
- Agent task completion rate with human satisfaction

## Constraints

- Initial deployment: Hostinger Business (Node apps + static site)
- Later: KVM VPS — same code, different process manager
- All agent actions auditable via integration logs and change log
- Custom session auth — no Supabase Auth
