-- Ensure only one PURCHASE_BONUS movement exists per purchase per organization
BEGIN;

-- Unique partial index: one PURCHASE_BONUS per purchase (related_entity_type = 'purchase_record') per organization
CREATE UNIQUE INDEX IF NOT EXISTS ux_mile_entries_purchase_bonus_per_purchase
ON mile_entries (organization_id, related_entity_id)
WHERE type = 'PURCHASE_BONUS' AND related_entity_type = 'purchase_record';

COMMIT;
