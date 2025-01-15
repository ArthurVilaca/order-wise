-- CreateTable
CREATE TABLE "MenuItem" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "embedding" DOUBLE PRECISION[],

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);
