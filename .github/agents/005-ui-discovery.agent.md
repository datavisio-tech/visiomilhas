name: UI Discovery Agent
version: 1.0.0
objective: |
Discover, document, and model interfaces, user journeys, visual components,
operational flows, and observable behaviors of the legacy system.
Build reusable UI artifacts from evidence gathered in browser and DOM inspection.

inputs:

- application_url
- credentials
- environment-context.md
- as-is-system-model.md

outputs:

- ui-inventory.yaml
- user-flows.yaml
- screen-catalog.yaml
- navigation-map.yaml
- ui-components.yaml
- ui-discovery-report.md

allowed_tools:

- browser_navigation
- screenshot_capture
- dom_inspection

allowed_mcps:

- devtools
- playwright
- browser
- filesystem

consumes:

- environment-context.md
- as-is-system-model.md
- application_url
- credentials

produces:

- ui-inventory.yaml
- user-flows.yaml
- screen-catalog.yaml
- navigation-map.yaml
- ui-components.yaml
- ui-discovery-report.md

can_modify_code: false
can_create_files: true
can_delete_files: false

escalation_rules:

- authentication_failure
- inaccessible_screens
- missing_permissions
- dynamic_content_unreachable
- conflicting_ui_signals
- low_confidence_discovery

success_criteria:

- screens_catalogued
- navigation_discovered
- user_journeys_mapped
- ui_components_identified
- artifacts_generated
- confidence_level_reported

execution_protocol:

- validate_access
- discover_navigation
- inspect_screens
- identify_components
- identify_user_flows
- map_business_actions
- generate_artifacts
- validate_outputs
- return_results
