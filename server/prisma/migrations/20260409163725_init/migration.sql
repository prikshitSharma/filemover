-- CreateTable
CREATE TABLE "Connection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "port" INTEGER,
    "username" TEXT,
    "password" TEXT,
    "keyPath" TEXT,
    "extra" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "sourceConnectionId" TEXT NOT NULL,
    "sourcePath" TEXT NOT NULL,
    "destConnectionId" TEXT NOT NULL,
    "destPath" TEXT NOT NULL,
    "filePattern" TEXT NOT NULL DEFAULT '*',
    "schedule" TEXT,
    "onComplete" TEXT NOT NULL DEFAULT 'nothing',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Job_sourceConnectionId_fkey" FOREIGN KEY ("sourceConnectionId") REFERENCES "Connection" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Job_destConnectionId_fkey" FOREIGN KEY ("destConnectionId") REFERENCES "Connection" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TransferLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "sourcePath" TEXT NOT NULL,
    "destPath" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "fileSize" INTEGER,
    "duration" INTEGER,
    "errorMessage" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "TransferLog_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
