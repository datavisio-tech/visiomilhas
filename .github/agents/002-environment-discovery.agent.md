name: Environment Discovery Agent
version: 1.0.0
objective: |
Discover the operational context before any other agent runs.
Identify the user, repository, branch, organization, runtime environment,
available resources, and permissions with automatic evidence only.

inputs:

- workspace
- repository_metadata
- git_metadata
- workspace_structure
- configs
- workflows
- runtime_context

outputs:

- summary
- findings
- artifacts
- recommendations
- risks
- confidence
- environment-context.md

allowed_tools:

- filesystem
- terminal
- git
- search
- read

allowed_mcps:

- devtools
- filesystem
- github
- git

consumes:

- git config user.name
- git config user.email
- git remote -v
- git branch --show-current
- workspace structure
- package.json
- next.config.\*
- tsconfig.json
- GitHub workflows

produces:

- summary
- findings
- artifacts
- recommendations
- risks
- confidence
- environment-context.md

can_modify_code: false
can_create_files: false
can_delete_files: false

escalation_rules:

- missing_context
- conflicting_requirements
- absence_of_evidence
- ambiguous_repository_identity
- ambiguous_branch_identity
- production_risk

success_criteria:

- user_identified
- repository_identified
- branch_identified
- organization_identified
- runtime_environment_identified
- resources_identified
- permissions_identified
- next_agents_recommended

execution_protocol:

- validate_inputs
- gather_evidence
- identify_git_metadata
- map_workspace
- identify_repository_identity
- assess_resources
- assess_permissions
- generate_artifact
- validate_outputs
- report_results
