# IA-1st Engine Bootstrap

This directory contains the bootstrap artifacts for the IA-1st agent engine.

Canonical load order:

1. Load the orchestrator compatibility path at .github/agents/ia1st-orchestrator.agent.md
2. Load agent-registry.yaml
3. Load execution-graph.yaml
4. Validate dependencies before task intake

The registry is built from the agent definitions currently present in the workspace
under .github/agents/ and .ai-first/.
