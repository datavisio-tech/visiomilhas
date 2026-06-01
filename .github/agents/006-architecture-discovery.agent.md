name: Architecture Discovery Agent
version: 1.0.0
objective: |
Discover, model, and document the current system architecture.
Identify modules, dependencies, layers, execution flows, coupling, responsibilities,
and architectural risks from evidence in the repository and companion artifacts.

inputs:

- environment-context.md
- as-is-system-model.md
- technical-inventory.yaml
- dependency-map.yaml
- business-capabilities.yaml
- business-rules-catalog.yaml
- ui-inventory.yaml
- navigation-map.yaml
- source_code

outputs:

- as-is-architecture.yaml
- module-map.yaml
- dependency-graph.yaml
- architectural-risks.yaml
- modernization-boundaries.yaml
- architecture-discovery-report.md

allowed_tools:

- filesystem
- code_search
- repository_analysis
- dependency_analysis
- architecture_inspection

allowed_mcps:

- devtools
- filesystem
- github
- git

consumes:

- as-is-system-model.md
- business-capabilities.yaml
- business-rules-catalog.yaml
- ui-inventory.yaml
- navigation-map.yaml
- dependency-map.yaml
- technical-inventory.yaml
- source_code

produces:

- as-is-architecture.yaml
- module-map.yaml
- dependency-graph.yaml
- architectural-risks.yaml
- modernization-boundaries.yaml
- architecture-discovery-report.md

can_modify_code: false
can_create_files: true
can_delete_files: false

escalation_rules:

- conflicting_architecture_patterns
- insufficient_evidence
- hidden_dependencies
- unknown_runtime_components
- low_confidence_discovery

success_criteria:

- architecture_documented
- modules_identified
- dependencies_mapped
- risks_documented
- modernization_boundaries_defined
- confidence_level_reported

execution_protocol:

- validate_inputs
- identify_modules
- identify_layers
- identify_dependencies
- identify_execution_flows
- identify_architectural_patterns
- identify_risks
- identify_modernization_boundaries
- generate_artifacts
- validate_outputs
- return_results
