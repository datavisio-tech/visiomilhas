name: Business Discovery Agent
version: 1.0.0
objective: |
Discover, catalog, and document business rules, operational processes,
functional flows, user profiles, and enterprise capabilities that already
exist in the analyzed system.

inputs:

- environment-context.md
- as-is-system-model.md
- technical-inventory.yaml
- dependency-map.yaml
- source_code
- database_schema
- api_contracts
- documentation
- ui_inventory
- user_flows

outputs:

- business-rules-catalog.yaml
- business-capabilities.yaml
- user-profiles.yaml
- business-processes.yaml
- business-glossary.yaml
- business-discovery-report.md

allowed_tools:

- filesystem
- git
- terminal
- database_inspector
- code_search
- documentation_reader

allowed_mcps:

- devtools
- filesystem
- github
- git
- postgres
- mongodb

consumes:

- environment-context.md
- as-is-system-model.md
- technical-inventory.yaml
- dependency-map.yaml
- as-is-architecture.yaml
- module-map.yaml
- dependency-graph.yaml
- architectural-risks.yaml
- modernization-boundaries.yaml
- ui-inventory.yaml
- user-flows.yaml
- screen-catalog.yaml
- navigation-map.yaml
- ui-components.yaml

produces:

- business-rules-catalog.yaml
- business-capabilities.yaml
- user-profiles.yaml
- business-processes.yaml
- business-discovery-report.md

can_modify_code: false
can_create_files: true
can_delete_files: false

escalation_rules:

- conflicting_business_rules
- low_confidence_discovery
- missing_business_context
- multiple_possible_interpretations
- regulatory_uncertainty

success_criteria:

- business_rules_identified
- business_processes_mapped
- user_roles_identified
- business_capabilities_documented
- confidence_level_reported
- artifacts_generated

execution_protocol:

- validate_inputs
- discover_business_entities
- discover_business_processes
- discover_business_rules
- discover_user_profiles
- discover_operational_flows
- correlate_code_and_business
- generate_business_artifacts
- validate_artifacts
- return_results
