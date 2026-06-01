name: Infrastructure Discovery Agent
version: 1.0.0
objective: |
Discover, document, and model all infrastructure used by the system.
Identify environments, servers, databases, pipelines, observability,
deployment flow, and operational dependencies from evidence.

inputs:

- environment-context.md
- as-is-architecture.yaml
- technical-inventory.yaml
- deployment_scripts
- github_workflows
- infrastructure_configs

outputs:

- infrastructure-landscape.yaml
- deployment-topology.yaml
- environment-catalog.yaml
- cicd-inventory.yaml
- observability-inventory.yaml
- infrastructure-discovery-report.md

allowed_tools:

- filesystem
- repository_analysis
- workflow_analysis
- configuration_analysis

allowed_mcps:

- github
- filesystem
- devtools
- git

consumes:

- environment-context.md
- as-is-architecture.yaml
- technical-inventory.yaml

produces:

- infrastructure-landscape.yaml
- deployment-topology.yaml
- environment-catalog.yaml
- cicd-inventory.yaml
- observability-inventory.yaml
- infrastructure-discovery-report.md

can_modify_code: false
can_create_files: true
can_delete_files: false

escalation_rules:

- inaccessible_environment
- missing_deployment_information
- unknown_runtime_components
- missing_permissions
- low_confidence_discovery

success_criteria:

- environments_documented
- deployment_flow_mapped
- infrastructure_catalog_generated
- ci_cd_identified
- observability_documented
- confidence_level_reported

execution_protocol:

- validate_inputs
- discover_environments
- discover_servers
- discover_databases
- discover_deployment_flow
- discover_ci_cd
- discover_monitoring
- discover_observability
- generate_artifacts
- validate_outputs
- return_results
