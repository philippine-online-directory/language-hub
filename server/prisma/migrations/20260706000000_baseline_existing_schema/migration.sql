-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ReminderType" AS ENUM ('WORD', 'CHECKWORD');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('LEARNER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('UNVERIFIED', 'VERIFIED');

-- CreateEnum
CREATE TYPE "ImportBatchStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'ROLLED_BACK');

-- CreateEnum
CREATE TYPE "ImportRowStatus" AS ENUM ('IMPORTED', 'SKIPPED_DUPLICATE', 'INVALID', 'REJECTED', 'ROLLED_BACK');

-- CreateEnum
CREATE TYPE "GameType" AS ENUM ('FLASHCARD', 'MATCHING', 'WRITING');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" "Role" NOT NULL DEFAULT 'LEARNER',
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "reminderType" "ReminderType",
    "lastReminderSentAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Language" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "speakerCount" INTEGER,
    "isoCode" TEXT,
    "slug" TEXT NOT NULL,
    "preservationNote" TEXT,
    "culturalBackground" TEXT,
    "completionCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Language_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Translation" (
    "id" TEXT NOT NULL,
    "wordText" TEXT NOT NULL,
    "englishDefinition" TEXT NOT NULL,
    "exampleSentence" TEXT,
    "status" "Status" NOT NULL DEFAULT 'UNVERIFIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),
    "audioUrl" TEXT,
    "partOfSpeech" TEXT,
    "usedAsWordOfTheDay" BOOLEAN NOT NULL DEFAULT false,
    "usageComment" TEXT,
    "languageId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "commonWordId" INTEGER,

    CONSTRAINT "Translation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "status" "ImportBatchStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "rightsConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "importedRows" INTEGER NOT NULL DEFAULT 0,
    "skippedRows" INTEGER NOT NULL DEFAULT 0,
    "rejectedRows" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "languageId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "reviewedById" TEXT,

    CONSTRAINT "ImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportBatchRow" (
    "id" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "wordText" TEXT,
    "englishDefinition" TEXT,
    "exampleSentence" TEXT,
    "partOfSpeech" TEXT,
    "usageComment" TEXT,
    "status" "ImportRowStatus" NOT NULL,
    "errorMessage" TEXT,
    "importBatchId" TEXT NOT NULL,
    "translationId" TEXT,

    CONSTRAINT "ImportBatchRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TranslationUpdateRequest" (
    "id" TEXT NOT NULL,
    "translationId" TEXT NOT NULL,
    "submittedById" TEXT NOT NULL,
    "languageId" TEXT NOT NULL,
    "proposedData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TranslationUpdateRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VocabSet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT NOT NULL,
    "languageId" TEXT NOT NULL,

    CONSTRAINT "VocabSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SetWord" (
    "translationId" TEXT NOT NULL,
    "vocabSetId" TEXT NOT NULL,

    CONSTRAINT "SetWord_pkey" PRIMARY KEY ("translationId","vocabSetId")
);

-- CreateTable
CREATE TABLE "GameSession" (
    "id" TEXT NOT NULL,
    "gameType" "GameType" NOT NULL,
    "score" INTEGER NOT NULL,
    "duration" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "vocabSetId" TEXT NOT NULL,

    CONSTRAINT "GameSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WordOfTheDay" (
    "id" TEXT NOT NULL DEFAULT 'current',
    "displayDate" DATE NOT NULL,
    "translationId" TEXT NOT NULL,

    CONSTRAINT "WordOfTheDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommonWord" (
    "id" SERIAL NOT NULL,
    "word" TEXT NOT NULL,

    CONSTRAINT "CommonWord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestEmailSubscription" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "unsubscribeToken" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuestEmailSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_secondaryAuthors" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_secondaryAuthors_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "User_lastReminderSentAt_idx" ON "User"("lastReminderSentAt");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Language_name_key" ON "Language"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Language_isoCode_key" ON "Language"("isoCode");

-- CreateIndex
CREATE UNIQUE INDEX "Language_slug_key" ON "Language"("slug");

-- CreateIndex
CREATE INDEX "Translation_languageId_status_wordText_idx" ON "Translation"("languageId", "status", "wordText");

-- CreateIndex
CREATE INDEX "Translation_languageId_status_createdAt_idx" ON "Translation"("languageId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Translation_languageId_commonWordId_idx" ON "Translation"("languageId", "commonWordId");

-- CreateIndex
CREATE INDEX "Translation_languageId_englishDefinition_idx" ON "Translation"("languageId", "englishDefinition");

-- CreateIndex
CREATE INDEX "Translation_authorId_createdAt_idx" ON "Translation"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "Translation_commonWordId_idx" ON "Translation"("commonWordId");

-- CreateIndex
CREATE INDEX "Translation_usedAsWordOfTheDay_status_idx" ON "Translation"("usedAsWordOfTheDay", "status");

-- CreateIndex
CREATE INDEX "ImportBatch_languageId_createdAt_idx" ON "ImportBatch"("languageId", "createdAt");

-- CreateIndex
CREATE INDEX "ImportBatch_uploadedById_createdAt_idx" ON "ImportBatch"("uploadedById", "createdAt");

-- CreateIndex
CREATE INDEX "ImportBatch_reviewedById_idx" ON "ImportBatch"("reviewedById");

-- CreateIndex
CREATE INDEX "ImportBatch_status_createdAt_idx" ON "ImportBatch"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ImportBatchRow_importBatchId_rowNumber_idx" ON "ImportBatchRow"("importBatchId", "rowNumber");

-- CreateIndex
CREATE INDEX "ImportBatchRow_translationId_idx" ON "ImportBatchRow"("translationId");

-- CreateIndex
CREATE INDEX "TranslationUpdateRequest_languageId_createdAt_idx" ON "TranslationUpdateRequest"("languageId", "createdAt");

-- CreateIndex
CREATE INDEX "TranslationUpdateRequest_translationId_idx" ON "TranslationUpdateRequest"("translationId");

-- CreateIndex
CREATE INDEX "TranslationUpdateRequest_submittedById_createdAt_idx" ON "TranslationUpdateRequest"("submittedById", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "VocabSet_name_key" ON "VocabSet"("name");

-- CreateIndex
CREATE INDEX "VocabSet_ownerId_createdAt_idx" ON "VocabSet"("ownerId", "createdAt");

-- CreateIndex
CREATE INDEX "VocabSet_isPublic_createdAt_idx" ON "VocabSet"("isPublic", "createdAt");

-- CreateIndex
CREATE INDEX "VocabSet_languageId_idx" ON "VocabSet"("languageId");

-- CreateIndex
CREATE INDEX "SetWord_vocabSetId_idx" ON "SetWord"("vocabSetId");

-- CreateIndex
CREATE INDEX "GameSession_userId_vocabSetId_gameType_idx" ON "GameSession"("userId", "vocabSetId", "gameType");

-- CreateIndex
CREATE INDEX "GameSession_vocabSetId_idx" ON "GameSession"("vocabSetId");

-- CreateIndex
CREATE INDEX "CommonWord_word_idx" ON "CommonWord"("word");

-- CreateIndex
CREATE UNIQUE INDEX "GuestEmailSubscription_email_key" ON "GuestEmailSubscription"("email");

-- CreateIndex
CREATE UNIQUE INDEX "GuestEmailSubscription_unsubscribeToken_key" ON "GuestEmailSubscription"("unsubscribeToken");

-- CreateIndex
CREATE INDEX "_secondaryAuthors_B_index" ON "_secondaryAuthors"("B");

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Translation" ADD CONSTRAINT "Translation_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Translation" ADD CONSTRAINT "Translation_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Translation" ADD CONSTRAINT "Translation_commonWordId_fkey" FOREIGN KEY ("commonWordId") REFERENCES "CommonWord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatchRow" ADD CONSTRAINT "ImportBatchRow_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatchRow" ADD CONSTRAINT "ImportBatchRow_translationId_fkey" FOREIGN KEY ("translationId") REFERENCES "Translation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TranslationUpdateRequest" ADD CONSTRAINT "TranslationUpdateRequest_translationId_fkey" FOREIGN KEY ("translationId") REFERENCES "Translation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TranslationUpdateRequest" ADD CONSTRAINT "TranslationUpdateRequest_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VocabSet" ADD CONSTRAINT "VocabSet_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VocabSet" ADD CONSTRAINT "VocabSet_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SetWord" ADD CONSTRAINT "SetWord_translationId_fkey" FOREIGN KEY ("translationId") REFERENCES "Translation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SetWord" ADD CONSTRAINT "SetWord_vocabSetId_fkey" FOREIGN KEY ("vocabSetId") REFERENCES "VocabSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_vocabSetId_fkey" FOREIGN KEY ("vocabSetId") REFERENCES "VocabSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordOfTheDay" ADD CONSTRAINT "WordOfTheDay_translationId_fkey" FOREIGN KEY ("translationId") REFERENCES "Translation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_secondaryAuthors" ADD CONSTRAINT "_secondaryAuthors_A_fkey" FOREIGN KEY ("A") REFERENCES "Translation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_secondaryAuthors" ADD CONSTRAINT "_secondaryAuthors_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
