-- AlterTable
ALTER TABLE "Translation" ADD COLUMN "slug" TEXT;

-- Backfill stable, language-scoped slugs in creation order.
DO $$
DECLARE
    translation_record RECORD;
    base_slug TEXT;
    candidate_slug TEXT;
    suffix INTEGER;
BEGIN
    FOR translation_record IN
        SELECT "id", "languageId", "wordText"
        FROM "Translation"
        ORDER BY "languageId", "createdAt", "id"
    LOOP
        base_slug := trim(BOTH '-' FROM regexp_replace(
            lower(trim(translation_record."wordText")),
            '[^a-z0-9]+',
            '-',
            'g'
        ));

        IF base_slug = '' THEN
            base_slug := 'word';
        END IF;

        candidate_slug := base_slug;
        suffix := 2;

        WHILE EXISTS (
            SELECT 1
            FROM "Translation"
            WHERE "languageId" = translation_record."languageId"
              AND "slug" = candidate_slug
        ) LOOP
            candidate_slug := base_slug || '-' || suffix;
            suffix := suffix + 1;
        END LOOP;

        UPDATE "Translation"
        SET "slug" = candidate_slug
        WHERE "id" = translation_record."id";
    END LOOP;
END $$;

ALTER TABLE "Translation" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Translation_languageId_slug_key" ON "Translation"("languageId", "slug");
