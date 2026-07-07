-- Enable trigram indexes for existing substring searches that use contains/ILIKE.
-- Production databases may require enabling this extension manually with an owner/admin role.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Btree indexes currently declared in schema.prisma. IF NOT EXISTS keeps this
-- migration safe for databases that previously received these via db push.
CREATE INDEX IF NOT EXISTS "User_createdAt_idx" ON "User" ("createdAt");
CREATE INDEX IF NOT EXISTS "User_lastReminderSentAt_idx" ON "User" ("lastReminderSentAt");

CREATE INDEX IF NOT EXISTS "PasswordResetToken_userId_idx" ON "PasswordResetToken" ("userId");
CREATE INDEX IF NOT EXISTS "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken" ("expiresAt");

CREATE INDEX IF NOT EXISTS "Translation_languageId_status_wordText_idx" ON "Translation" ("languageId", "status", "wordText");
CREATE INDEX IF NOT EXISTS "Translation_languageId_status_createdAt_idx" ON "Translation" ("languageId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "Translation_languageId_commonWordId_idx" ON "Translation" ("languageId", "commonWordId");
CREATE INDEX IF NOT EXISTS "Translation_languageId_englishDefinition_idx" ON "Translation" ("languageId", "englishDefinition");
CREATE INDEX IF NOT EXISTS "Translation_authorId_createdAt_idx" ON "Translation" ("authorId", "createdAt");
CREATE INDEX IF NOT EXISTS "Translation_commonWordId_idx" ON "Translation" ("commonWordId");
CREATE INDEX IF NOT EXISTS "Translation_usedAsWordOfTheDay_status_idx" ON "Translation" ("usedAsWordOfTheDay", "status");

CREATE INDEX IF NOT EXISTS "ImportBatch_languageId_createdAt_idx" ON "ImportBatch" ("languageId", "createdAt");
CREATE INDEX IF NOT EXISTS "ImportBatch_uploadedById_createdAt_idx" ON "ImportBatch" ("uploadedById", "createdAt");
CREATE INDEX IF NOT EXISTS "ImportBatch_reviewedById_idx" ON "ImportBatch" ("reviewedById");
CREATE INDEX IF NOT EXISTS "ImportBatch_status_createdAt_idx" ON "ImportBatch" ("status", "createdAt");

CREATE INDEX IF NOT EXISTS "ImportBatchRow_importBatchId_rowNumber_idx" ON "ImportBatchRow" ("importBatchId", "rowNumber");
CREATE INDEX IF NOT EXISTS "ImportBatchRow_translationId_idx" ON "ImportBatchRow" ("translationId");

CREATE INDEX IF NOT EXISTS "TranslationUpdateRequest_languageId_createdAt_idx" ON "TranslationUpdateRequest" ("languageId", "createdAt");
CREATE INDEX IF NOT EXISTS "TranslationUpdateRequest_translationId_idx" ON "TranslationUpdateRequest" ("translationId");
CREATE INDEX IF NOT EXISTS "TranslationUpdateRequest_submittedById_createdAt_idx" ON "TranslationUpdateRequest" ("submittedById", "createdAt");

CREATE INDEX IF NOT EXISTS "VocabSet_ownerId_createdAt_idx" ON "VocabSet" ("ownerId", "createdAt");
CREATE INDEX IF NOT EXISTS "VocabSet_isPublic_createdAt_idx" ON "VocabSet" ("isPublic", "createdAt");
CREATE INDEX IF NOT EXISTS "VocabSet_languageId_idx" ON "VocabSet" ("languageId");

CREATE INDEX IF NOT EXISTS "SetWord_vocabSetId_idx" ON "SetWord" ("vocabSetId");

CREATE INDEX IF NOT EXISTS "GameSession_userId_vocabSetId_gameType_idx" ON "GameSession" ("userId", "vocabSetId", "gameType");
CREATE INDEX IF NOT EXISTS "GameSession_vocabSetId_idx" ON "GameSession" ("vocabSetId");

CREATE INDEX IF NOT EXISTS "CommonWord_word_idx" ON "CommonWord" ("word");

-- Trigram indexes preserve current substring search behavior while making
-- contains/ILIKE lookups faster on larger tables.
CREATE INDEX IF NOT EXISTS "Translation_wordText_trgm_idx" ON "Translation" USING GIN ("wordText" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Translation_englishDefinition_trgm_idx" ON "Translation" USING GIN ("englishDefinition" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "VocabSet_name_trgm_idx" ON "VocabSet" USING GIN ("name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "User_username_trgm_idx" ON "User" USING GIN ("username" gin_trgm_ops);

-- Case-insensitive exact translator lookups.
CREATE INDEX IF NOT EXISTS "Translation_languageId_wordText_lower_idx" ON "Translation" ("languageId", lower("wordText"));
CREATE INDEX IF NOT EXISTS "Translation_languageId_englishDefinition_lower_idx" ON "Translation" ("languageId", lower("englishDefinition"));
