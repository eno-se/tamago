-- CreateTable
CREATE TABLE "watch_lists" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eggId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "watch_lists_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "watch_lists_userId_eggId_key" ON "watch_lists"("userId", "eggId");

-- AddForeignKey
ALTER TABLE "watch_lists" ADD CONSTRAINT "watch_lists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watch_lists" ADD CONSTRAINT "watch_lists_eggId_fkey" FOREIGN KEY ("eggId") REFERENCES "eggs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
