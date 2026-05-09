-- CreateTable
CREATE TABLE `notifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('INQUIRY_CREATED', 'WHATSAPP_LEAD_CREATED', 'EMAIL_CAMPAIGN_COMPLETED', 'EMAIL_CAMPAIGN_FAILED', 'MEDIA_FAILED', 'SMTP_INVALID', 'SYSTEM_WARNING') NOT NULL,
    `severity` ENUM('INFO', 'SUCCESS', 'WARNING', 'ERROR') NOT NULL DEFAULT 'INFO',
    `title` VARCHAR(190) NOT NULL,
    `message` VARCHAR(700) NOT NULL,
    `resource_type` VARCHAR(120) NULL,
    `resource_id` INTEGER NULL,
    `actor_type` VARCHAR(120) NULL,
    `actor_id` INTEGER NULL,
    `expires_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_created_at_idx`(`created_at`),
    INDEX `notifications_type_created_at_idx`(`type`, `created_at`),
    INDEX `notifications_resource_type_resource_id_idx`(`resource_type`, `resource_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_reads` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `notification_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `read_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `notification_reads_notification_id_user_id_key`(`notification_id`, `user_id`),
    INDEX `notification_reads_user_id_read_at_idx`(`user_id`, `read_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_email_jobs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `notification_id` INTEGER NULL,
    `recipient_email` VARCHAR(190) NOT NULL,
    `subject` VARCHAR(255) NOT NULL,
    `body_text` TEXT NOT NULL,
    `body_html` TEXT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'SENT', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `next_attempt_at` DATETIME(3) NULL,
    `locked_at` DATETIME(3) NULL,
    `last_error` TEXT NULL,
    `sent_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `notification_email_jobs_status_next_attempt_at_created_at_idx`(`status`, `next_attempt_at`, `created_at`),
    INDEX `notification_email_jobs_notification_id_idx`(`notification_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `notification_reads` ADD CONSTRAINT `notification_reads_notification_id_fkey` FOREIGN KEY (`notification_id`) REFERENCES `notifications`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification_reads` ADD CONSTRAINT `notification_reads_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification_email_jobs` ADD CONSTRAINT `notification_email_jobs_notification_id_fkey` FOREIGN KEY (`notification_id`) REFERENCES `notifications`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
