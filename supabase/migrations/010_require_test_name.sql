WITH unnamed_tests AS (
  SELECT
    id,
    COALESCE(NULLIF(subtest, ''), 'Tage Mage') AS subtest_key,
    ROW_NUMBER() OVER (
      PARTITION BY COALESCE(NULLIF(subtest, ''), 'Tage Mage')
      ORDER BY date NULLS LAST, created_at NULLS LAST, id
    ) AS seq
  FROM tests
  WHERE name IS NULL OR TRIM(name) = ''
)
UPDATE tests AS t
SET name = CONCAT(
  INITCAP(ut.subtest_key),
  ' #',
  ut.seq
)
FROM unnamed_tests AS ut
WHERE t.id = ut.id;

-- Enforce presence of name going forward
ALTER TABLE tests
ALTER COLUMN name SET NOT NULL;
