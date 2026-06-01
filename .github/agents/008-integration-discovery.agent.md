name: Integration Discovery Agent
version: 1.0.0
objective: |
Discover, catalog, and document all internal and external integrations used by the system.
Identify dependencies, protocols, authentication patterns, flows, and operational criticality.

inputs:

- environment-context.md
- technical-inventory.yaml
- as-is-architecture.yaml
- source_code
- configuration_files
- environment_variables

outputs:

- integration-landscape.yaml
- api-catalog.yaml
- webhook-catalog.yaml
- external-dependencies.yaml
- integration-risk-report.yaml

allowed_tools:

- filesystem
- code_search
- configuration_analysis
- repository_analysis

allowed_mcps:

- github
- filesystem
- devtools

consumes:

- technical-inventory.yaml
- as-is-architecture.yaml

produces:

- integration-landscape.yaml
- api-catalog.yaml
- external-dependencies.yaml
- webhook-catalog.yaml
- integration-risk-report.yaml

can_modify_code: false
can_create_files: true
can_delete_files: false

escalation_rules:

- missing_credentials
- inaccessible_integrations
- unknown_protocols
- low_confidence_discovery

success_criteria:

- integrations_identified
- dependencies_catalogued
- risks_documented
- confidence_level_reported

execution_protocol:

- validate_inputs
- inspect_configurations
- inspect_source_code
- identify_integrations
- classify_integrations
- generate_artifacts
- validate_outputs
- return_results
