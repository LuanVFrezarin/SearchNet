-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'CONSULTANT');

-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('BASIC', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('CRITICAL', 'MEDIUM', 'LOW', 'CONFIG');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CONSULTANT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "errors" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "root_cause" TEXT,
    "solution" TEXT NOT NULL,
    "netsuite_path" TEXT,
    "how_to_test" TEXT,
    "post_validation" TEXT,
    "difficulty_level" "DifficultyLevel" NOT NULL DEFAULT 'BASIC',
    "severity" "Severity" NOT NULL DEFAULT 'MEDIUM',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "errors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "error_images" (
    "id" TEXT NOT NULL,
    "error_id" TEXT,
    "image_url" TEXT NOT NULL,
    "extracted_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "error_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "error_tags" (
    "error_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,

    CONSTRAINT "error_tags_pkey" PRIMARY KEY ("error_id","tag_id")
);

-- CreateTable
CREATE TABLE "error_feedback" (
    "id" TEXT NOT NULL,
    "error_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "worked" BOOLEAN NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "error_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "error_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "error_embeddings" (
    "error_id" TEXT NOT NULL,
    "embedding_vector" JSONB NOT NULL,

    CONSTRAINT "error_embeddings_pkey" PRIMARY KEY ("error_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- AddForeignKey
ALTER TABLE "errors" ADD CONSTRAINT "errors_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "error_images" ADD CONSTRAINT "error_images_error_id_fkey" FOREIGN KEY ("error_id") REFERENCES "errors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "error_tags" ADD CONSTRAINT "error_tags_error_id_fkey" FOREIGN KEY ("error_id") REFERENCES "errors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "error_tags" ADD CONSTRAINT "error_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "error_feedback" ADD CONSTRAINT "error_feedback_error_id_fkey" FOREIGN KEY ("error_id") REFERENCES "errors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "error_feedback" ADD CONSTRAINT "error_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_error_id_fkey" FOREIGN KEY ("error_id") REFERENCES "errors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "error_embeddings" ADD CONSTRAINT "error_embeddings_error_id_fkey" FOREIGN KEY ("error_id") REFERENCES "errors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
