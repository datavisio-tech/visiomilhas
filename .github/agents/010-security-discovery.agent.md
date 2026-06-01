name: Security Discovery Agent
version: 1.0.0
objective: |
Discover, catalog, and assess security risks, authentication, authorization,
data protection, vulnerable dependencies, and sensitive information exposure
present in the system.

inputs:

- environment-context.md
- technical-inventory.yaml
- as-is-architecture.yaml
- integration-landscape.yaml
- source_code
- configuration_files
- environment_variables

outputs:

- security-assessment.yaml
- authentication-model.yaml
- authorization-model.yaml
- secret-exposure-report.yaml
- dependency-vulnerability-report.yaml
- security-discovery-report.md

allowed_tools:

- filesystem
- dependency_analysis
- code_search
- configuration_analysis

allowed_mcps:

- github
- filesystem
- devtools

consumes:

- as-is-architecture.yaml
- integration-landscape.yaml

produces:

- security-assessment.yaml
- authentication-model.yaml
- authorization-model.yaml
- secret-exposure-report.yaml
- dependency-vulnerability-report.yaml
- security-discovery-report.md

can_modify_code: false
can_create_files: true
can_delete_files: false

escalation_rules:

- exposed_secrets
- critical_vulnerability
- authentication_failure
- authorization_gap
- regulatory_risk
- low_confidence_discovery

success_criteria:

- security_model_documented
- vulnerabilities_identified
- risks_classified
- mitigation_recommendations_generated
- confidence_level_reported

execution_protocol:

- validate_inputs
- inspect_authentication
- inspect_authorization
- inspect_dependencies
- inspect_secrets
- inspect_sensitive_data
- classify_risks
- generate_artifacts
- validate_outputs
- return_results
