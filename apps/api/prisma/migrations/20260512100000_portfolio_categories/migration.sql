-- CreateTable
CREATE TABLE `portfolio_categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(120) NOT NULL,
    `slug` VARCHAR(140) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('DRAFT', 'PUBLISHED', 'INACTIVE') NOT NULL DEFAULT 'PUBLISHED',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `portfolio_categories_name_key`(`name`),
    UNIQUE INDEX `portfolio_categories_slug_key`(`slug`),
    INDEX `portfolio_categories_status_sort_order_idx`(`status`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `portfolios` ADD COLUMN `category_id` INTEGER NULL;

-- Seed default categories used by the public portfolio filter.
INSERT INTO `portfolio_categories` (`name`, `slug`, `sort_order`, `status`, `created_at`, `updated_at`)
VALUES
    ('Jersey', 'jersey', 10, 'PUBLISHED', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
    ('Polo', 'polo', 20, 'PUBLISHED', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
    ('Wearpack', 'wearpack', 30, 'PUBLISHED', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
    ('Jaket', 'jaket', 40, 'PUBLISHED', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
    ('Hoodie', 'hoodie', 50, 'PUBLISHED', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
    ('Seragam', 'seragam', 60, 'PUBLISHED', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
    ('Kaos', 'kaos', 70, 'PUBLISHED', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
    ('Tas', 'tas', 80, 'PUBLISHED', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));

-- Preserve existing non-default category names so no portfolio loses its grouping.
INSERT INTO `portfolio_categories` (`name`, `slug`, `sort_order`, `status`, `created_at`, `updated_at`)
SELECT DISTINCT
    legacy.`name`,
    CONCAT('kategori-', SUBSTRING(MD5(legacy.`normalized_name`), 1, 12)),
    1000,
    'PUBLISHED',
    CURRENT_TIMESTAMP(3),
    CURRENT_TIMESTAMP(3)
FROM (
    SELECT
        MIN(TRIM(p.`category`)) AS `name`,
        LOWER(TRIM(p.`category`)) AS `normalized_name`
    FROM `portfolios` p
    WHERE TRIM(p.`category`) <> ''
    GROUP BY LOWER(TRIM(p.`category`))
) legacy
LEFT JOIN `portfolio_categories` pc ON LOWER(pc.`name`) = legacy.`normalized_name`
WHERE pc.`id` IS NULL;

-- Backfill portfolio relation from the legacy category text.
UPDATE `portfolios` p
INNER JOIN `portfolio_categories` pc ON LOWER(pc.`name`) = LOWER(TRIM(p.`category`))
SET p.`category_id` = pc.`id`
WHERE p.`category_id` IS NULL;

-- CreateIndex
CREATE INDEX `portfolios_status_category_id_sort_order_idx` ON `portfolios`(`status`, `category_id`, `sort_order`);

-- AddForeignKey
ALTER TABLE `portfolios` ADD CONSTRAINT `portfolios_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `portfolio_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
