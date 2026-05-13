-- Content lifecycle: archived records are reversible and distinct from permanent delete.
ALTER TABLE `hero_sections`
  MODIFY `status` ENUM('DRAFT', 'PUBLISHED', 'INACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'PUBLISHED',
  ADD COLUMN `previous_status` ENUM('DRAFT', 'PUBLISHED', 'INACTIVE', 'ARCHIVED') NULL,
  ADD COLUMN `archived_at` DATETIME(3) NULL,
  ADD COLUMN `archived_by` INTEGER NULL;
CREATE INDEX `hero_sections_status_archived_at_idx` ON `hero_sections`(`status`, `archived_at`);

ALTER TABLE `hero_slides`
  MODIFY `status` ENUM('DRAFT', 'PUBLISHED', 'INACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'PUBLISHED',
  ADD COLUMN `previous_status` ENUM('DRAFT', 'PUBLISHED', 'INACTIVE', 'ARCHIVED') NULL,
  ADD COLUMN `archived_at` DATETIME(3) NULL,
  ADD COLUMN `archived_by` INTEGER NULL;
CREATE INDEX `hero_slides_status_archived_at_idx` ON `hero_slides`(`status`, `archived_at`);

ALTER TABLE `partners`
  MODIFY `status` ENUM('DRAFT', 'PUBLISHED', 'INACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'PUBLISHED',
  ADD COLUMN `previous_status` ENUM('DRAFT', 'PUBLISHED', 'INACTIVE', 'ARCHIVED') NULL,
  ADD COLUMN `archived_at` DATETIME(3) NULL,
  ADD COLUMN `archived_by` INTEGER NULL;
CREATE INDEX `partners_status_archived_at_idx` ON `partners`(`status`, `archived_at`);

ALTER TABLE `production_strengths`
  MODIFY `status` ENUM('DRAFT', 'PUBLISHED', 'INACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'PUBLISHED',
  ADD COLUMN `previous_status` ENUM('DRAFT', 'PUBLISHED', 'INACTIVE', 'ARCHIVED') NULL,
  ADD COLUMN `archived_at` DATETIME(3) NULL,
  ADD COLUMN `archived_by` INTEGER NULL;
CREATE INDEX `production_strengths_status_archived_at_idx` ON `production_strengths`(`status`, `archived_at`);

ALTER TABLE `portfolio_categories`
  MODIFY `status` ENUM('DRAFT', 'PUBLISHED', 'INACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'PUBLISHED',
  ADD COLUMN `previous_status` ENUM('DRAFT', 'PUBLISHED', 'INACTIVE', 'ARCHIVED') NULL,
  ADD COLUMN `archived_at` DATETIME(3) NULL,
  ADD COLUMN `archived_by` INTEGER NULL;
CREATE INDEX `portfolio_categories_status_archived_at_idx` ON `portfolio_categories`(`status`, `archived_at`);

ALTER TABLE `portfolios`
  MODIFY `status` ENUM('DRAFT', 'PUBLISHED', 'INACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN `previous_status` ENUM('DRAFT', 'PUBLISHED', 'INACTIVE', 'ARCHIVED') NULL,
  ADD COLUMN `archived_at` DATETIME(3) NULL,
  ADD COLUMN `archived_by` INTEGER NULL;
CREATE INDEX `portfolios_status_archived_at_idx` ON `portfolios`(`status`, `archived_at`);

ALTER TABLE `machines`
  MODIFY `status` ENUM('DRAFT', 'PUBLISHED', 'INACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'PUBLISHED',
  ADD COLUMN `previous_status` ENUM('DRAFT', 'PUBLISHED', 'INACTIVE', 'ARCHIVED') NULL,
  ADD COLUMN `archived_at` DATETIME(3) NULL,
  ADD COLUMN `archived_by` INTEGER NULL;
CREATE INDEX `machines_status_archived_at_idx` ON `machines`(`status`, `archived_at`);

ALTER TABLE `printing_capacities`
  MODIFY `status` ENUM('DRAFT', 'PUBLISHED', 'INACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'PUBLISHED',
  ADD COLUMN `previous_status` ENUM('DRAFT', 'PUBLISHED', 'INACTIVE', 'ARCHIVED') NULL,
  ADD COLUMN `archived_at` DATETIME(3) NULL,
  ADD COLUMN `archived_by` INTEGER NULL;
CREATE INDEX `printing_capacities_status_archived_at_idx` ON `printing_capacities`(`status`, `archived_at`);

ALTER TABLE `production_capacities`
  MODIFY `status` ENUM('DRAFT', 'PUBLISHED', 'INACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'PUBLISHED',
  ADD COLUMN `previous_status` ENUM('DRAFT', 'PUBLISHED', 'INACTIVE', 'ARCHIVED') NULL,
  ADD COLUMN `archived_at` DATETIME(3) NULL,
  ADD COLUMN `archived_by` INTEGER NULL;
CREATE INDEX `production_capacities_status_archived_at_idx` ON `production_capacities`(`status`, `archived_at`);

ALTER TABLE `services`
  MODIFY `status` ENUM('DRAFT', 'PUBLISHED', 'INACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'PUBLISHED',
  ADD COLUMN `previous_status` ENUM('DRAFT', 'PUBLISHED', 'INACTIVE', 'ARCHIVED') NULL,
  ADD COLUMN `archived_at` DATETIME(3) NULL,
  ADD COLUMN `archived_by` INTEGER NULL;
CREATE INDEX `services_status_archived_at_idx` ON `services`(`status`, `archived_at`);

ALTER TABLE `gallery_items`
  MODIFY `status` ENUM('DRAFT', 'PUBLISHED', 'INACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN `previous_status` ENUM('DRAFT', 'PUBLISHED', 'INACTIVE', 'ARCHIVED') NULL,
  ADD COLUMN `archived_at` DATETIME(3) NULL,
  ADD COLUMN `archived_by` INTEGER NULL;
CREATE INDEX `gallery_items_status_archived_at_idx` ON `gallery_items`(`status`, `archived_at`);

ALTER TABLE `news`
  MODIFY `status` ENUM('DRAFT', 'PUBLISHED', 'INACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN `previous_status` ENUM('DRAFT', 'PUBLISHED', 'INACTIVE', 'ARCHIVED') NULL,
  ADD COLUMN `archived_at` DATETIME(3) NULL,
  ADD COLUMN `archived_by` INTEGER NULL;
CREATE INDEX `news_status_archived_at_idx` ON `news`(`status`, `archived_at`);

-- Media lifecycle: archived keeps files, permanent delete attempts storage cleanup.
ALTER TABLE `media_files`
  MODIFY `status` ENUM('PROCESSING', 'COMPLETED', 'FAILED', 'ARCHIVED', 'PENDING_DELETE', 'DELETED', 'CLEANUP_FAILED') NOT NULL DEFAULT 'PROCESSING',
  ADD COLUMN `previous_status` ENUM('PROCESSING', 'COMPLETED', 'FAILED', 'ARCHIVED', 'PENDING_DELETE', 'DELETED', 'CLEANUP_FAILED') NULL,
  ADD COLUMN `archived_at` DATETIME(3) NULL,
  ADD COLUMN `archived_by` INTEGER NULL,
  ADD COLUMN `deleted_at` DATETIME(3) NULL,
  ADD COLUMN `deleted_by` INTEGER NULL;
CREATE INDEX `media_files_status_archived_at_idx` ON `media_files`(`status`, `archived_at`);
CREATE INDEX `media_files_status_deleted_at_idx` ON `media_files`(`status`, `deleted_at`);
