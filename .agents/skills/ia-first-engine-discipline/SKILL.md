---
name: ia-first-engine-discipline
description: Enforce the VisioMilhas IA-1stEngine operating discipline across all agent replies and handovers.
---

# IA-1stEngine Discipline

## Mandatory reply fields

Every operational reply must include:

- `AGENT`
- `SKILLS`
- `SOURCES CONSULTED`
- `STATUS`

If any field is missing, treat the draft as a `PROCESS_VIOLATION`, correct it internally, and only then answer.

## Consultation order

1. `docs/ai-context/`
2. `.agents/`
3. `docs/ai-context/CHANGELOG_AI.md`
4. `docs/ai-context/DECISIONS.md`
5. `docs/ai-context/IMPLEMENTATION_PLAN.md`
6. `docs/ai-context/failure-registry/`

## Fail and escalation rules

- Consult `failure-registry/` before declaring `FAIL`
- Consult `RECOVERY_PLAYBOOKS.md` before declaring `HUMAN_ACTION_REQUIRED`
- Prefer recovery, fallback, and retry before escalation

## Handover rules

- Use formal handovers with `DE / PARA / MOTIVO / SKILLS / DOCUMENTOS CONSULTADOS / AÇÃO EXECUTADA / PRÓXIMO PASSO / STATUS / SOURCES CONSULTED`
- Keep transitions factual and execution-oriented

## Scope

- Applies to all VisioMilhas agents and skills
- Acts as the base discipline layer for IA-1stEngine
