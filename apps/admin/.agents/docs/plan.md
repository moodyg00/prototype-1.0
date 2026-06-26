# Development Plan & Roadmap

## Phase 1: Foundation (Current)
- Setup both repos with identical Next.js 15 + coss ui + Prisma client pointing to shared DB
- Install coss ui strictly (pnpm dlx skills add cosscom/coss or equivalent)
- Create base layouts with coss components (sidebar, topbar, command palette)
- Port key Prisma types to shared package

## Phase 2: Human-Agent Task Interface
- Kanban + threaded chat for tasks
- Agent proposal / human approval flows
- Real-time collaboration (Supabase or sockets)

## Phase 3: Agent Memory Explorer
- Visual memory graph + editor
- Short-term / long-term / episodic memory models
- Link memories to business entities (Leads, WorkOrders, etc.)

## Phase 4: Content Creation Studio
- Web/social/physical content generation pipelines
- Multi-step agent workflows (research → draft → image/video → schedule)
- Integration with Grok image/video tools

## Phase 5: Business Startup Lab
- AI agent research opportunities
- Auto-generate comprehensive business plans, roadmaps, financials
- Prototype any business type using full toolset (code, media, docs)

## Phase 6: Polish & Scale
- Performance, security, multi-tenant
- Advanced orchestration for multiple agents
- Production deployment refinement

**Current Milestone**: Complete Phase 1 + basic Task Interface in admin-agent-GUI.