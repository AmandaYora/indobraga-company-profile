-- CreateTable
CREATE TABLE `marketing_contacts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(190) NOT NULL,
    `name` VARCHAR(190) NULL,
    `phone` VARCHAR(50) NULL,
    `company` VARCHAR(190) NULL,
    `source` ENUM('INQUIRY', 'WHATSAPP_LEAD', 'MANUAL_IMPORT', 'MANUAL') NOT NULL DEFAULT 'INQUIRY',
    `source_ref_id` INTEGER NULL,
    `status` ENUM('ACTIVE', 'UNSUBSCRIBED', 'BLOCKED') NOT NULL DEFAULT 'ACTIVE',
    `consent_status` ENUM('IMPLIED', 'EXPLICIT', 'UNKNOWN') NOT NULL DEFAULT 'IMPLIED',
    `tags` JSON NULL,
    `last_interaction_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `marketing_contacts_email_key`(`email`),
    INDEX `marketing_contacts_status_created_at_idx`(`status`, `created_at`),
    INDEX `marketing_contacts_source_source_ref_id_idx`(`source`, `source_ref_id`),
    INDEX `marketing_contacts_last_interaction_at_idx`(`last_interaction_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `email_campaign_recipients` ADD COLUMN `marketing_contact_id` INTEGER NULL;

-- CreateIndex
CREATE INDEX `email_campaign_recipients_marketing_contact_id_idx` ON `email_campaign_recipients`(`marketing_contact_id`);

-- AddForeignKey
ALTER TABLE `email_campaign_recipients` ADD CONSTRAINT `email_campaign_recipients_marketing_contact_id_fkey` FOREIGN KEY (`marketing_contact_id`) REFERENCES `marketing_contacts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
