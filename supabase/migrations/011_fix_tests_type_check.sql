-- Ensure tests.type accepts both TD and Blanc tags
ALTER TABLE tests
DROP CONSTRAINT IF EXISTS tests_type_check;

UPDATE tests
SET type = 'TD'
WHERE type IS NULL
   OR type NOT IN ('TD', 'Blanc');

ALTER TABLE tests
ADD CONSTRAINT tests_type_check
CHECK (type IN ('TD', 'Blanc'));
