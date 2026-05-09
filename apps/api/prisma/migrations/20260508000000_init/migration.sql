-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(120) NOT NULL,
    `email` VARCHAR(190) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` ENUM('SUPER_ADMIN', 'CONTENT_EDITOR') NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `last_login_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin_sessions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `token_hash` VARCHAR(255) NOT NULL,
    `user_agent` VARCHAR(500) NULL,
    `ip_hash` VARCHAR(255) NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `revoked_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `admin_sessions_token_hash_key`(`token_hash`),
    INDEX `admin_sessions_user_id_idx`(`user_id`),
    INDEX `admin_sessions_expires_at_idx`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `site_settings` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `brand` VARCHAR(120) NOT NULL DEFAULT 'Indobraga',
    `legal_name` VARCHAR(190) NOT NULL DEFAULT 'PT. Braga Indonesia Perkasa',
    `email` VARCHAR(190) NOT NULL DEFAULT 'indobraga@gmail.com',
    `phone` VARCHAR(50) NOT NULL DEFAULT '0851-5870-0895',
    `whatsapp` VARCHAR(50) NOT NULL DEFAULT '6285158700895',
    `instagram` VARCHAR(120) NOT NULL DEFAULT 'indobraga',
    `contact_person` VARCHAR(120) NOT NULL DEFAULT 'Mahardika',
    `contact_role` VARCHAR(120) NOT NULL DEFAULT 'Tim Marketing',
    `address` VARCHAR(500) NOT NULL DEFAULT 'Jalan Babakan Tarogong No. 292, Kota Bandung',
    `seo_title` VARCHAR(190) NULL,
    `seo_description` VARCHAR(500) NULL,
    `og_media_file_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hero_sections` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(190) NOT NULL,
    `subtitle` VARCHAR(500) NULL,
    `cta_label` VARCHAR(120) NULL,
    `cta_href` VARCHAR(255) NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'INACTIVE') NOT NULL DEFAULT 'PUBLISHED',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hero_slides` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hero_section_id` INTEGER NOT NULL,
    `label` VARCHAR(120) NULL,
    `title` VARCHAR(190) NOT NULL,
    `metric` VARCHAR(120) NULL,
    `alt_text` VARCHAR(255) NULL,
    `media_file_id` INTEGER NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('DRAFT', 'PUBLISHED', 'INACTIVE') NOT NULL DEFAULT 'PUBLISHED',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `hero_slides_hero_section_id_sort_order_idx`(`hero_section_id`, `sort_order`),
    INDEX `hero_slides_status_sort_order_idx`(`status`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `partners` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(190) NOT NULL,
    `segment` VARCHAR(120) NULL,
    `logo_media_id` INTEGER NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('DRAFT', 'PUBLISHED', 'INACTIVE') NOT NULL DEFAULT 'PUBLISHED',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `partners_status_sort_order_idx`(`status`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `production_strengths` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `label` VARCHAR(120) NOT NULL,
    `value` VARCHAR(50) NOT NULL,
    `suffix` VARCHAR(120) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('DRAFT', 'PUBLISHED', 'INACTIVE') NOT NULL DEFAULT 'PUBLISHED',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `production_strengths_status_sort_order_idx`(`status`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `portfolios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(190) NOT NULL,
    `slug` VARCHAR(190) NOT NULL,
    `category` VARCHAR(120) NOT NULL,
    `description` VARCHAR(700) NULL,
    `image_media_id` INTEGER NULL,
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('DRAFT', 'PUBLISHED', 'INACTIVE') NOT NULL DEFAULT 'DRAFT',
    `published_at` DATETIME(3) NULL,
    `seo_title` VARCHAR(190) NULL,
    `seo_description` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `portfolios_slug_key`(`slug`),
    INDEX `portfolios_status_featured_sort_order_idx`(`status`, `featured`, `sort_order`),
    INDEX `portfolios_status_category_sort_order_idx`(`status`, `category`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `machines` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(190) NOT NULL,
    `slug` VARCHAR(190) NOT NULL,
    `metric` VARCHAR(120) NULL,
    `description` VARCHAR(700) NULL,
    `image_media_id` INTEGER NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('DRAFT', 'PUBLISHED', 'INACTIVE') NOT NULL DEFAULT 'PUBLISHED',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `machines_slug_key`(`slug`),
    INDEX `machines_status_sort_order_idx`(`status`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `printing_capacities` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `label` VARCHAR(120) NOT NULL,
    `value` VARCHAR(50) NOT NULL,
    `unit` VARCHAR(120) NOT NULL,
    `description` VARCHAR(700) NULL,
    `image_media_id` INTEGER NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('DRAFT', 'PUBLISHED', 'INACTIVE') NOT NULL DEFAULT 'PUBLISHED',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `printing_capacities_status_sort_order_idx`(`status`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `production_capacities` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product` VARCHAR(120) NOT NULL,
    `value` VARCHAR(50) NOT NULL,
    `unit` VARCHAR(120) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('DRAFT', 'PUBLISHED', 'INACTIVE') NOT NULL DEFAULT 'PUBLISHED',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `production_capacities_status_sort_order_idx`(`status`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `services` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(190) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('DRAFT', 'PUBLISHED', 'INACTIVE') NOT NULL DEFAULT 'PUBLISHED',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `services_status_sort_order_idx`(`status`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `gallery_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('IMAGE', 'VIDEO', 'DOCUMENT') NOT NULL,
    `caption` VARCHAR(500) NOT NULL,
    `media_file_id` INTEGER NULL,
    `poster_media_id` INTEGER NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('DRAFT', 'PUBLISHED', 'INACTIVE') NOT NULL DEFAULT 'DRAFT',
    `published_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `gallery_items_status_sort_order_idx`(`status`, `sort_order`),
    INDEX `gallery_items_status_published_at_idx`(`status`, `published_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `news` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(190) NOT NULL,
    `slug` VARCHAR(190) NOT NULL,
    `category` VARCHAR(120) NOT NULL,
    `excerpt` VARCHAR(700) NOT NULL,
    `content` JSON NOT NULL,
    `thumbnail_media_id` INTEGER NULL,
    `og_media_id` INTEGER NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'INACTIVE') NOT NULL DEFAULT 'DRAFT',
    `published_at` DATETIME(3) NULL,
    `seo_title` VARCHAR(190) NULL,
    `seo_description` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `news_slug_key`(`slug`),
    INDEX `news_status_published_at_idx`(`status`, `published_at`),
    INDEX `news_status_category_published_at_idx`(`status`, `category`, `published_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inquiries` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(120) NOT NULL,
    `email` VARCHAR(190) NOT NULL,
    `phone` VARCHAR(50) NOT NULL,
    `company` VARCHAR(190) NULL,
    `message` TEXT NOT NULL,
    `status` ENUM('NEW', 'CONTACTED', 'CLOSED', 'SPAM') NOT NULL DEFAULT 'NEW',
    `notification_status` VARCHAR(50) NULL,
    `source` VARCHAR(120) NULL,
    `meta` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `inquiries_status_created_at_idx`(`status`, `created_at`),
    INDEX `inquiries_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `whatsapp_leads` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(120) NOT NULL,
    `phone` VARCHAR(50) NOT NULL,
    `message` VARCHAR(700) NULL,
    `whatsapp_url` VARCHAR(1000) NULL,
    `status` ENUM('NEW', 'CONTACTED', 'CLOSED', 'SPAM') NOT NULL DEFAULT 'NEW',
    `source` VARCHAR(120) NULL,
    `meta` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `whatsapp_leads_status_created_at_idx`(`status`, `created_at`),
    INDEX `whatsapp_leads_phone_idx`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `media_files` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `kind` ENUM('IMAGE', 'VIDEO', 'DOCUMENT') NOT NULL,
    `status` ENUM('PROCESSING', 'COMPLETED', 'FAILED', 'DELETED') NOT NULL DEFAULT 'PROCESSING',
    `original_filename` VARCHAR(255) NOT NULL,
    `mime_type` VARCHAR(120) NOT NULL,
    `extension` VARCHAR(20) NULL,
    `object_key` VARCHAR(500) NULL,
    `public_url` VARCHAR(1000) NULL,
    `thumbnail_url` VARCHAR(1000) NULL,
    `medium_url` VARCHAR(1000) NULL,
    `large_url` VARCHAR(1000) NULL,
    `poster_url` VARCHAR(1000) NULL,
    `video_url` VARCHAR(1000) NULL,
    `size_original_bytes` BIGINT NULL,
    `size_final_bytes` BIGINT NULL,
    `width` INTEGER NULL,
    `height` INTEGER NULL,
    `duration_seconds` INTEGER NULL,
    `checksum` VARCHAR(128) NULL,
    `variants` JSON NULL,
    `error_message` TEXT NULL,
    `created_by_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `media_files_object_key_key`(`object_key`),
    INDEX `media_files_kind_status_created_at_idx`(`kind`, `status`, `created_at`),
    INDEX `media_files_created_by_id_idx`(`created_by_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `email_accounts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `provider` ENUM('GOOGLE_OAUTH', 'SMTP_HOSTING') NOT NULL,
    `email` VARCHAR(190) NOT NULL,
    `display_name` VARCHAR(190) NOT NULL,
    `status` ENUM('CONNECTED', 'INVALID', 'DISABLED', 'NEEDS_RECONNECT') NOT NULL DEFAULT 'DISABLED',
    `google_subject` VARCHAR(190) NULL,
    `encrypted_access_token` TEXT NULL,
    `encrypted_refresh_token` TEXT NULL,
    `token_expires_at` DATETIME(3) NULL,
    `smtp_host` VARCHAR(190) NULL,
    `smtp_port` INTEGER NULL,
    `smtp_security` ENUM('SSL_TLS', 'STARTTLS', 'NONE') NULL,
    `smtp_username` VARCHAR(190) NULL,
    `encrypted_smtp_password` TEXT NULL,
    `last_test_at` DATETIME(3) NULL,
    `last_error` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `email_accounts_status_provider_idx`(`status`, `provider`),
    UNIQUE INDEX `email_accounts_provider_email_key`(`provider`, `email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `email_campaigns` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sender_account_id` INTEGER NOT NULL,
    `created_by_id` INTEGER NULL,
    `name` VARCHAR(190) NOT NULL,
    `subject` VARCHAR(255) NOT NULL,
    `body_text` TEXT NULL,
    `body_html` TEXT NULL,
    `status` ENUM('DRAFT', 'PENDING', 'SENDING', 'COMPLETED', 'FAILED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `total_recipients` INTEGER NOT NULL DEFAULT 0,
    `queued_count` INTEGER NOT NULL DEFAULT 0,
    `sent_count` INTEGER NOT NULL DEFAULT 0,
    `failed_count` INTEGER NOT NULL DEFAULT 0,
    `started_at` DATETIME(3) NULL,
    `finished_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `email_campaigns_status_created_at_idx`(`status`, `created_at`),
    INDEX `email_campaigns_sender_account_id_idx`(`sender_account_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `email_campaign_recipients` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `campaign_id` INTEGER NOT NULL,
    `email` VARCHAR(190) NOT NULL,
    `name` VARCHAR(190) NULL,
    `status` ENUM('QUEUED', 'SENDING', 'SENT', 'FAILED', 'SKIPPED') NOT NULL DEFAULT 'QUEUED',
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `next_attempt_at` DATETIME(3) NULL,
    `locked_at` DATETIME(3) NULL,
    `sent_at` DATETIME(3) NULL,
    `failed_at` DATETIME(3) NULL,
    `error_code` VARCHAR(120) NULL,
    `error_message` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `email_campaign_recipients_campaign_id_status_idx`(`campaign_id`, `status`),
    INDEX `email_campaign_recipients_status_next_attempt_at_idx`(`status`, `next_attempt_at`),
    UNIQUE INDEX `email_campaign_recipients_campaign_id_email_key`(`campaign_id`, `email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `email_send_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `campaign_id` INTEGER NOT NULL,
    `recipient_id` INTEGER NULL,
    `provider` VARCHAR(120) NOT NULL,
    `status` VARCHAR(50) NOT NULL,
    `message_id` VARCHAR(190) NULL,
    `error_code` VARCHAR(120) NULL,
    `error_message` TEXT NULL,
    `response_meta` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `email_send_logs_campaign_id_created_at_idx`(`campaign_id`, `created_at`),
    INDEX `email_send_logs_recipient_id_idx`(`recipient_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `revalidation_events` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `resource_type` VARCHAR(120) NOT NULL,
    `resource_id` INTEGER NULL,
    `cache_key` VARCHAR(255) NOT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `last_error` TEXT NULL,
    `processed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `revalidation_events_status_created_at_idx`(`status`, `created_at`),
    INDEX `revalidation_events_resource_type_resource_id_idx`(`resource_type`, `resource_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `actor_user_id` INTEGER NULL,
    `action` VARCHAR(120) NOT NULL,
    `resource_type` VARCHAR(120) NULL,
    `resource_id` INTEGER NULL,
    `ip_hash` VARCHAR(255) NULL,
    `user_agent` VARCHAR(500) NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_actor_user_id_created_at_idx`(`actor_user_id`, `created_at`),
    INDEX `audit_logs_resource_type_resource_id_idx`(`resource_type`, `resource_id`),
    INDEX `audit_logs_action_created_at_idx`(`action`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `admin_sessions` ADD CONSTRAINT `admin_sessions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `site_settings` ADD CONSTRAINT `site_settings_og_media_file_id_fkey` FOREIGN KEY (`og_media_file_id`) REFERENCES `media_files`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hero_slides` ADD CONSTRAINT `hero_slides_hero_section_id_fkey` FOREIGN KEY (`hero_section_id`) REFERENCES `hero_sections`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hero_slides` ADD CONSTRAINT `hero_slides_media_file_id_fkey` FOREIGN KEY (`media_file_id`) REFERENCES `media_files`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partners` ADD CONSTRAINT `partners_logo_media_id_fkey` FOREIGN KEY (`logo_media_id`) REFERENCES `media_files`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `portfolios` ADD CONSTRAINT `portfolios_image_media_id_fkey` FOREIGN KEY (`image_media_id`) REFERENCES `media_files`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `machines` ADD CONSTRAINT `machines_image_media_id_fkey` FOREIGN KEY (`image_media_id`) REFERENCES `media_files`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `printing_capacities` ADD CONSTRAINT `printing_capacities_image_media_id_fkey` FOREIGN KEY (`image_media_id`) REFERENCES `media_files`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `gallery_items` ADD CONSTRAINT `gallery_items_media_file_id_fkey` FOREIGN KEY (`media_file_id`) REFERENCES `media_files`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `gallery_items` ADD CONSTRAINT `gallery_items_poster_media_id_fkey` FOREIGN KEY (`poster_media_id`) REFERENCES `media_files`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `news` ADD CONSTRAINT `news_thumbnail_media_id_fkey` FOREIGN KEY (`thumbnail_media_id`) REFERENCES `media_files`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `news` ADD CONSTRAINT `news_og_media_id_fkey` FOREIGN KEY (`og_media_id`) REFERENCES `media_files`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `media_files` ADD CONSTRAINT `media_files_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `email_campaigns` ADD CONSTRAINT `email_campaigns_sender_account_id_fkey` FOREIGN KEY (`sender_account_id`) REFERENCES `email_accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `email_campaigns` ADD CONSTRAINT `email_campaigns_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `email_campaign_recipients` ADD CONSTRAINT `email_campaign_recipients_campaign_id_fkey` FOREIGN KEY (`campaign_id`) REFERENCES `email_campaigns`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `email_send_logs` ADD CONSTRAINT `email_send_logs_campaign_id_fkey` FOREIGN KEY (`campaign_id`) REFERENCES `email_campaigns`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `email_send_logs` ADD CONSTRAINT `email_send_logs_recipient_id_fkey` FOREIGN KEY (`recipient_id`) REFERENCES `email_campaign_recipients`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_actor_user_id_fkey` FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
