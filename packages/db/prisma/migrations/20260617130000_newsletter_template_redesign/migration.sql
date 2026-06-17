-- AlterTable
ALTER TABLE "brand_settings" ADD COLUMN     "nlLogoUrl" TEXT,
ADD COLUMN     "nlLogoWidth" INTEGER,
ADD COLUMN     "nlSectionColor1" TEXT,
ADD COLUMN     "nlSectionColor2" TEXT,
ADD COLUMN     "nlSectionColor3" TEXT,
ADD COLUMN     "nlSectionColor4" TEXT;
-- AlterTable
ALTER TABLE "newsletter_topics" DROP COLUMN "kidsSnack",
DROP COLUMN "techFreeActivity",
ADD COLUMN     "recipe2" TEXT;
-- AlterTable
ALTER TABLE "newsletters" ADD COLUMN     "summaryImageUrl" TEXT,
ADD COLUMN     "summaryTitle" TEXT;
