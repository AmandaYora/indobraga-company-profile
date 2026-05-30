ALTER TABLE `site_settings` MODIFY COLUMN `show_brand_text` BOOLEAN NOT NULL DEFAULT false;

UPDATE `site_settings`
SET `show_brand_text` = false
WHERE `id` = 1;
