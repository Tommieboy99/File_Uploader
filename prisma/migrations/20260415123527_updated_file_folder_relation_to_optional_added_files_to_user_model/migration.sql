/*
  Warnings:

  - A unique constraint covering the columns `[name,userId,folderId]` on the table `File` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `File` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "File_name_folderId_key";

-- AlterTable
ALTER TABLE "File" ADD COLUMN     "userId" INTEGER NOT NULL,
ALTER COLUMN "folderId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Folder" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "File_name_userId_folderId_key" ON "File"("name", "userId", "folderId");

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
