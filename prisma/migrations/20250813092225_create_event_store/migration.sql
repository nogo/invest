-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventType" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "events_eventType_timestamp_idx" ON "events"("eventType", "timestamp");

-- CreateIndex
CREATE INDEX "events_timestamp_idx" ON "events"("timestamp");

CREATE VIEW broker_accounts AS 
SELECT DISTINCT 
  json_extract(payload, '$.brokerName') as brokerName,
  json_extract(payload, '$.accountId') as accountId
FROM events 
WHERE json_extract(payload, '$.brokerName') IS NOT NULL 
  AND json_extract(payload, '$.brokerName') != '' 
  AND json_extract(payload, '$.accountId') IS NOT NULL 
  AND json_extract(payload, '$.accountId') != ''
ORDER BY brokerName, accountId