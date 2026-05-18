-- AlterTable
ALTER TABLE "Personnel" ADD COLUMN     "canViewSirketim" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canViewRaporlar" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canViewPlanlarim" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canViewBayiler" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canViewCari" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canViewStok" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canViewDisServis" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canViewBekleyen" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canViewIkinciEl" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canViewCihazSorgula" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canViewCihazKayit" BOOLEAN NOT NULL DEFAULT false;
