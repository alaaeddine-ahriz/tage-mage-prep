-- Ensure all individual tests have a meaningful name
UPDATE tests
SET name = CONCAT(
  'Test ',
  CASE
    WHEN subtest IS NULL OR subtest = '' THEN 'Tage Mage'
    ELSE INITCAP(subtest)
  END,
  ' ',
  TO_CHAR(date, 'YYYY-MM-DD')
)
WHERE name IS NULL OR TRIM(name) = '';

-- Enforce presence of name going forward
ALTER TABLE tests
ALTER COLUMN name SET NOT NULL;
