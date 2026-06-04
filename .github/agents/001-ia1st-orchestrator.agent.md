name: IA-1st Orchestrator
version: 1.0.0
objective: |
Orchestrate discovery, analysis, reconstruction, modernization, testing,
and deployment planning without assuming the stack in advance.
Route work through the official discovery chain and require evidence for every conclusion.

inputs:

- objective
- artifacts
- constraints
- environment-context.md
- technical-inventory.yaml
- dependency-map.yaml
- business-capabilities.yaml
- business-rules-catalog.yaml
- user-profiles.yaml
- business-processes.yaml
- business-glossary.yaml
- ui-inventory.yaml
- user-flows.yaml
- screen-catalog.yaml
- navigation-map.yaml
- ui-components.yaml
- as-is-architecture.yaml
- module-map.yaml
- dependency-graph.yaml
- architectural-risks.yaml
- modernization-boundaries.yaml
- domain-model.yaml
- entity-catalog.yaml
- relationship-map.yaml
- bounded-contexts.yaml
- persistence-inventory.yaml
- integration-landscape.yaml
- api-catalog.yaml
- webhook-catalog.yaml
- external-dependencies.yaml
- integration-risk-report.yaml
- tribal-knowledge-catalog.yaml
- undocumented-rules.yaml
- architectural-decisions.yaml
- security-assessment.yaml
- authentication-model.yaml
- authorization-model.yaml
- secret-exposure-report.yaml
- dependency-vulnerability-report.yaml
- infrastructure-landscape.yaml
- deployment-topology.yaml
- environment-catalog.yaml
- cicd-inventory.yaml
- observability-inventory.yaml
- technical-debt-report.yaml
- code-quality-report.yaml
- test-coverage-report.yaml
- complexity-report.yaml
- modernization-priority-matrix.yaml
- modernization-candidates.yaml
- as-is-system-model.md

outputs:

- summary
- findings
- artifacts
- recommendations
- risks
- confidence
- execution-plan.md

allowed_tools:

- filesystem
- search
- git
- read
- agent
- todo

allowed_mcps:

- devtools
- filesystem
- github
- git

consumes:

- environment-context.md
- technical-inventory.yaml
- dependency-map.yaml
- business-capabilities.yaml
- business-rules-catalog.yaml
- user-profiles.yaml
- business-processes.yaml
- business-glossary.yaml
- ui-inventory.yaml
- user-flows.yaml
- screen-catalog.yaml
- navigation-map.yaml
- ui-components.yaml
- as-is-architecture.yaml
- module-map.yaml
- dependency-graph.yaml
- architectural-risks.yaml
- modernization-boundaries.yaml
- domain-model.yaml
- entity-catalog.yaml
- relationship-map.yaml
- bounded-contexts.yaml
- persistence-inventory.yaml
- integration-landscape.yaml
- api-catalog.yaml
- webhook-catalog.yaml
- external-dependencies.yaml
- integration-risk-report.yaml
- tribal-knowledge-catalog.yaml
- undocumented-rules.yaml
- architectural-decisions.yaml
- security-assessment.yaml
- authentication-model.yaml
- authorization-model.yaml
- secret-exposure-report.yaml
- dependency-vulnerability-report.yaml
- infrastructure-landscape.yaml
- deployment-topology.yaml
- environment-catalog.yaml
- cicd-inventory.yaml
- observability-inventory.yaml
- technical-debt-report.yaml
- code-quality-report.yaml
- test-coverage-report.yaml
- complexity-report.yaml
- modernization-priority-matrix.yaml
- modernization-candidates.yaml
- as-is-system-model.md
- docs/ai-context/
- docs/specs/
- docs/ai-skills/
- docs/ai-context/knowledge-base/

produces:

- summary
- findings
- artifacts
- recommendations
- risks
- confidence
- execution-plan.md

artifact_registry:

environment-context.md:
producer: Environment Discovery Agent

technical-inventory.yaml:
producer: Project Discovery Agent

dependency-map.yaml:
producer: Project Discovery Agent

business-rules-catalog.yaml:
producer: Business Discovery Agent

business-capabilities.yaml:
producer: Business Discovery Agent

ui-inventory.yaml:
producer: UI Discovery Agent

navigation-map.yaml:
producer: UI Discovery Agent

as-is-architecture.yaml:
producer: Architecture Discovery Agent

domain-model.yaml:
producer: Data Model Discovery Agent

relationship-map.yaml:
producer: Data Model Discovery Agent

integration-landscape.yaml:
producer: Integration Discovery Agent

tribal-knowledge-catalog.yaml:
producer: Legacy Knowledge Discovery Agent

security-assessment.yaml:
producer: Security Discovery Agent

infrastructure-landscape.yaml:
producer: Infrastructure Discovery Agent

technical-debt-report.yaml:
producer: Quality Discovery Agent

code-quality-report.yaml:
producer: Quality Discovery Agent

test-coverage-report.yaml:
producer: Quality Discovery Agent

complexity-report.yaml:
producer: Quality Discovery Agent

modernization-priority-matrix.yaml:
producer: Quality Discovery Agent

can_modify_code: false
can_create_files: false
can_delete_files: false

governance:
release_policy:
code_review:
required: true

    	security_review:
    		required: true

    	automated_tests:
    		required: true

    	quality_gates:
    		required: true

    	rollback_plan:
    		required: true

    	deployment_allowed_only_if:

    		quality_score: ">= 80"

    		security_score: ">= 85"

    		critical_vulnerabilities: 0

escalation_rules:

- missing_context
- conflicting_requirements
- architecture_conflict
- security_risk
- production_risk
- absence_of_evidence
- multiple_valid_interpretations
- financial_impact
- legal_impact

success_criteria:

- environment_discovered
- project_discovered
- specialists_routed
- dependencies_identified
- risks_identified
- plan_ready
- approval_requests_emitted_when_needed

execution_protocol:

- validate_inputs
- gather_evidence
- if_blank_screen_or_hydration_failure_route_runtime_forensics_first
- route_environment_discovery
- route_project_discovery
- route_business_discovery
- route_legacy_knowledge_discovery
- route_architecture_discovery
- route_data_model_discovery
- route_integration_discovery
- route_security_discovery
- route_infrastructure_discovery
- route_quality_discovery
- route_ui_discovery
- route_specialists
- consolidate_results
- generate_execution_plan
- validate_outputs
- report_results

runtime_forensics_policy:

- trigger_conditions:
  - tela_branca
  - white_screen
  - hydration_failure
  - React_418
  - React_423
  - HierarchyRequestError
  - NotFoundError
  - document_doctype_null

- mandatory_flow:
  - Runtime Forensics
  - HTML Validation
  - Container Validation
  - Deploy Validation
  - Proxy Routing Validation
  - Browser Hydration Validation
  - Frontend Investigation

- governance_rule: |
  When production shows a blank screen, hydration failure, React #418,
  React #423, HierarchyRequestError, NotFoundError, or missing
  document.doctype, agents must first validate raw HTML, active container,
  active image, deploy provenance, and proxy routing before changing React
  components.

- required_skill:
  - .agents/skills/runtime-deploy-forensics/SKILL.md

- reference_knowledge_base:
  - docs/ai-context/knowledge-base/KB-0001-DOCKER-WORKDIR-APP-ROUTER-COLLISION.md
