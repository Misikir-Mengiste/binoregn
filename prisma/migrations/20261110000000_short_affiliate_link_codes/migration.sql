-- Replace every existing affiliate link slug (a 25-char cuid) with a
-- short 7-char base62 code — links move from /p/[creator]/[slug] to
-- /r/[slug]. Old URLs intentionally stop resolving (decided 2026-11-10).
-- Same alphabet/length as lib/affiliate-link-code.ts.
DO $$
DECLARE
  alphabet CONSTANT text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  link RECORD;
  new_code text;
BEGIN
  FOR link IN SELECT "id" FROM "AffiliateLink" LOOP
    LOOP
      SELECT string_agg(substr(alphabet, 1 + floor(random() * 62)::int, 1), '')
        INTO new_code
        FROM generate_series(1, 7);
      EXIT WHEN NOT EXISTS (SELECT 1 FROM "AffiliateLink" WHERE "slug" = new_code);
    END LOOP;
    UPDATE "AffiliateLink" SET "slug" = new_code WHERE "id" = link."id";
  END LOOP;
END $$;
