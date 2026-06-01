name: Quality Discovery Agent
version: 1.0.0
objective: |
Assess the technical quality of the system by identifying technical debt,
complexity, duplication, test coverage, coupling, maintenance risks,
and opportunities for improvement.

inputs:

- technical-inventory.yaml
- dependency-map.yaml
- as-is-architecture.yaml
- source_code
- test_suite
- ci_cd_inventory

outputs:

- technical-debt-report.yaml
- code-quality-report.yaml
- test-coverage-report.yaml
- complexity-report.yaml
- modernization-priority-matrix.yaml

allowed_tools:

- filesystem
- code_analysis
- dependency_analysis
- test_analysis

allowed_mcps:

- github
- filesystem
- devtools

consumes:

- technical-inventory.yaml
- dependency-map.yaml
- as-is-architecture.yaml

produces:

- technical-debt-report.yaml
- code-quality-report.yaml
- test-coverage-report.yaml
- complexity-report.yaml
- modernization-priority-matrix.yaml

can_modify_code: false
can_create_files: true
can_delete_files: false

escalation_rules:

- insufficient_source_code
- missing_test_information
- inaccessible_modules
- low_confidence_discovery

success_criteria:

- technical_debt_measured
- complexity_measured
- test_quality_assessed
- modernization_priorities_defined
- confidence_level_reported

execution_protocol:

- validate_inputs
- inspect_source_code
- inspect_dependencies
- inspect_tests
- calculate_metrics
- classify_risks
- generate_artifacts
- validate_outputs
- return_results
