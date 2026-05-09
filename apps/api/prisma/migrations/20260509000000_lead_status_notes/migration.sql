-- AlterTable
ALTER TABLE `inquiries`
  MODIFY `status` ENUM('NEW', 'CONTACTED', 'IN_PROGRESS', 'CLOSED', 'SPAM') NOT NULL DEFAULT 'NEW',
  ADD COLUMN `internal_note` TEXT NULL AFTER `status`,
  ADD COLUMN `archived_at` DATETIME(3) NULL AFTER `meta`;

-- AlterTable
ALTER TABLE `whatsapp_leads`
  MODIFY `status` ENUM('NEW', 'CONTACTED', 'IN_PROGRESS', 'CLOSED', 'SPAM') NOT NULL DEFAULT 'NEW',
  ADD COLUMN `internal_note` TEXT NULL AFTER `status`,
  ADD COLUMN `archived_at` DATETIME(3) NULL AFTER `meta`;
