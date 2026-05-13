-- Store the website logo in object storage so admins can replace it from the dashboard.
ALTER TABLE `site_settings` ADD COLUMN `logo_media_file_id` INTEGER NULL;

ALTER TABLE `site_settings` ADD CONSTRAINT `site_settings_logo_media_file_id_fkey`
FOREIGN KEY (`logo_media_file_id`) REFERENCES `media_files`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
