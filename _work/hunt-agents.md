---
title: "Hunt agents"
description: "AI agents that recon, hunt and validate bugs alongside me."
status: building
order: 1
stages: [recon, analysis, discovery, validation]
topics: [ai-agents, recon]
---

An agent pipeline that works the way I work: map the target, understand its roles and state, look for the places where trust is assumed, and prove a finding before anyone reads about it.

## The pipeline

1. **Recon.** Collect hosts, endpoints and the shape of the API.
2. **Analysis.** Build a model of roles, objects and state transitions.
3. **Discovery.** Look for broken assumptions: object ownership, role checks, workflow order.
4. **Validation.** Reproduce with real accounts before anything becomes a report.

## Status

In progress. Writeups about how it is built, and what it finds, will be linked here as they are published.
