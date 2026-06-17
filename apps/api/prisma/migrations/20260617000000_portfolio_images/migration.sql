-- CreateTable
CREATE TABLE `portfolio_images` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `portfolio_id` INTEGER NOT NULL,
    `media_file_id` INTEGER NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `portfolio_images_portfolio_id_sort_order_idx`(`portfolio_id`, `sort_order`),
    INDEX `portfolio_images_media_file_id_idx`(`media_file_id`),
    UNIQUE INDEX `portfolio_images_portfolio_id_media_file_id_key`(`portfolio_id`, `media_file_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Backfill: migrate the existing single cover image into the new gallery table
-- so existing portfolios follow the multi-image schema (cover becomes image #0).
INSERT INTO `portfolio_images` (`portfolio_id`, `media_file_id`, `sort_order`, `created_at`, `updated_at`)
SELECT `id`, `image_media_id`, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
FROM `portfolios`
WHERE `image_media_id` IS NOT NULL;

-- AddForeignKey
ALTER TABLE `portfolio_images` ADD CONSTRAINT `portfolio_images_portfolio_id_fkey` FOREIGN KEY (`portfolio_id`) REFERENCES `portfolios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `portfolio_images` ADD CONSTRAINT `portfolio_images_media_file_id_fkey` FOREIGN KEY (`media_file_id`) REFERENCES `media_files`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
