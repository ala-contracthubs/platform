-- CreateEnum
CREATE TYPE "role" AS ENUM ('CLIENT', 'AGENT');

-- CreateEnum
CREATE TYPE "agent_state" AS ENUM ('SOLO', 'AGENCY');

-- CreateTable
CREATE TABLE "individual" (
    "id" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "individual_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_grant" (
    "id" TEXT NOT NULL,
    "individual_id" TEXT NOT NULL,
    "role" "role" NOT NULL,
    "agent_state" "agent_state",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_grant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "individual_id" TEXT NOT NULL,
    "active_role" "role" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_challenge" (
    "id" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "verified_at" TIMESTAMP(3),
    "verification_token" TEXT,
    "consumed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_challenge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "individual_mobile_key" ON "individual"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "role_grant_individual_id_role_key" ON "role_grant"("individual_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "otp_challenge_verification_token_key" ON "otp_challenge"("verification_token");

-- CreateIndex
CREATE INDEX "otp_challenge_mobile_idx" ON "otp_challenge"("mobile");

-- AddForeignKey
ALTER TABLE "role_grant" ADD CONSTRAINT "role_grant_individual_id_fkey" FOREIGN KEY ("individual_id") REFERENCES "individual"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_individual_id_fkey" FOREIGN KEY ("individual_id") REFERENCES "individual"("id") ON DELETE CASCADE ON UPDATE CASCADE;
