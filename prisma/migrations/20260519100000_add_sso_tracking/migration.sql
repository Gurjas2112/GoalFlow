-- AlterTable
ALTER TABLE "User" ADD COLUMN     "authProvider" TEXT NOT NULL DEFAULT 'LOCAL';
ALTER TABLE "User" ADD COLUMN     "azureOid" TEXT;
ALTER TABLE "User" ADD COLUMN     "lastSsoLoginAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "User_azureOid_key" ON "User"("azureOid");
