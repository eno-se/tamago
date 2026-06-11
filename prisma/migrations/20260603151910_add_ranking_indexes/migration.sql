-- CreateIndex
CREATE INDEX "eggs_status_isPublic_currentTapCount_idx" ON "eggs"("status", "isPublic", "currentTapCount" DESC);

-- CreateIndex
CREATE INDEX "fan_egg_stats_currentStreakDays_eggId_idx" ON "fan_egg_stats"("currentStreakDays", "eggId");
