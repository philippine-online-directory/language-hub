-- CreateTable
CREATE TABLE "TranslationTerm" (
    "translationId" TEXT NOT NULL,
    "languageId" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "TranslationTerm_pkey" PRIMARY KEY ("translationId","term")
);

-- CreateIndex
CREATE INDEX "TranslationTerm_languageId_term_idx" ON "TranslationTerm"("languageId", "term");

-- AddForeignKey
ALTER TABLE "TranslationTerm" ADD CONSTRAINT "TranslationTerm_translationId_fkey" FOREIGN KEY ("translationId") REFERENCES "Translation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Splits an English definition into normalized search terms:
-- "To run (fast); sprint, the race" -> run (0), sprint (1), race (2).
-- The translator also uses it to normalize queries, so both sides always agree.
CREATE OR REPLACE FUNCTION translation_english_terms(definition TEXT)
RETURNS TABLE (term TEXT, "position" INTEGER)
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
    SELECT DISTINCT ON (parts.term) parts.term, parts.ord::INTEGER - 1
    FROM (
        SELECT
            btrim(regexp_replace(
                regexp_replace(lower(part), '\s+', ' ', 'g'),
                '^\s*(to|an|a|the)\s+', ''
            ), ' .') AS term,
            ord
        FROM regexp_split_to_table(
            regexp_replace(definition, '\([^)]*\)', '', 'g'),
            '[,;/]'
        ) WITH ORDINALITY AS split(part, ord)
    ) AS parts
    WHERE parts.term <> ''
    ORDER BY parts.term, parts.ord
$$;

CREATE OR REPLACE FUNCTION sync_translation_terms()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
    DELETE FROM "TranslationTerm" WHERE "translationId" = NEW."id";

    INSERT INTO "TranslationTerm" ("translationId", "languageId", "term", "position")
    SELECT NEW."id", NEW."languageId", terms.term, terms."position"
    FROM translation_english_terms(NEW."englishDefinition") AS terms;

    RETURN NULL;
END;
$$;

CREATE TRIGGER "Translation_sync_terms"
AFTER INSERT OR UPDATE OF "englishDefinition", "languageId" ON "Translation"
FOR EACH ROW EXECUTE FUNCTION sync_translation_terms();

-- Backfill existing translations.
INSERT INTO "TranslationTerm" ("translationId", "languageId", "term", "position")
SELECT t."id", t."languageId", terms.term, terms."position"
FROM "Translation" t
CROSS JOIN LATERAL translation_english_terms(t."englishDefinition") AS terms;

-- Trigram index for "did you mean" suggestions.
CREATE INDEX "TranslationTerm_term_trgm_idx" ON "TranslationTerm" USING GIN ("term" gin_trgm_ops);
