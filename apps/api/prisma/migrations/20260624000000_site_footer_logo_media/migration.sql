-- Separate footer logo so the navbar and footer can show different logos.
-- Footer falls back to the navbar logo when this is NULL (handled in the app layer).
ALTER TABLE `site_settings` ADD COLUMN `footer_logo_media_file_id` INTEGER NULL;

ALTER TABLE `site_settings` ADD CONSTRAINT `site_settings_footer_logo_media_file_id_fkey`
FOREIGN KEY (`footer_logo_media_file_id`) REFERENCES `media_files`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
