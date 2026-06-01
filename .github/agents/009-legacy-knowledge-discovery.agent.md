name: Legacy Knowledge Discovery Agent
version: 1.0.0
objective: |
Discover implicit knowledge, historical decisions, undocumented rules,
and operational context that exist outside the source code.
Build a reusable catalog of tribal knowledge from repository history and documentation.

inputs:

- repository
- documentation
- commit_history
- pull_requests
- issues
- changelogs
- architecture_documents

outputs:

- tribal-knowledge-catalog.yaml
- undocumented-rules.yaml
- architectural-decisions.yaml
- knowledge-discovery-report.md

allowed_tools:

- filesystem
- git
- repository_analysis
- documentation_analysis

allowed_mcps:

- github
- git
- filesystem

consumes:

- as-is-system-model.md
- business-rules-catalog.yaml

produces:

- tribal-knowledge-catalog.yaml
- undocumented-rules.yaml
- architectural-decisions.yaml
- knowledge-discovery-report.md

can_modify_code: false
can_create_files: true
can_delete_files: false

escalation_rules:

- contradictory_information
- insufficient_evidence
- inaccessible_history
- low_confidence_discovery

success_criteria:

- historical_decisions_identified
- undocumented_rules_identified
- knowledge_catalog_generated
- confidence_level_reported

execution_protocol:

- validate_inputs
- inspect_documentation
- inspect_commits
- inspect_pull_requests
- inspect_issues
- correlate_findings
- generate_artifacts
- validate_outputs
- return_results
