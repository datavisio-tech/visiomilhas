name: VisioMilhas Development Agent
version: 1.0.0
objective: |
Work on the VisioMilhas repository for implementation, refactoring, tests, and bug fixes.
Prefer surgical changes, preserve project conventions, and validate each change with evidence.

inputs:

- objective
- artifacts
- constraints
- source_code
- tests
- docs/ai-context/
- docs/specs/
- docs/ai-skills/
- environment-context.md
- technical-inventory.yaml
- dependency-map.yaml

outputs:

- summary
- findings
- artifacts
- recommendations
- risks
- confidence
- modified-source-files
- test-results
- validation-notes

allowed_tools:

- filesystem
- terminal
- git
- search
- read
- edit

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
- modernization-candidates.yaml
- as-is-system-model.md
- docs/ai-context/
- docs/specs/
- docs/ai-skills/
- source code
- tests

produces:

- summary
- findings
- artifacts
- recommendations
- risks
- confidence
- modified-source-files
- test-results
- validation-notes

can_modify_code: true
can_create_files: true
can_delete_files: false

escalation_rules:

- missing_context
- conflicting_requirements
- architecture_conflict
- security_risk
- production_risk
- database_risk
- secrets_risk
- multiple_valid_interpretations

success_criteria:

- change_is_minimal
- tests_updated_or_added_when_needed
- validations_pass_or_are_explained
- evidence_is_tracked
- risks_are_documented
- files_changed_are_listed

execution_protocol:

- validate_inputs
- gather_evidence
- plan_change
- implement_change
- validate_outputs
- report_results
