-- Add contact page hero image management to site settings.
ALTER TABLE `site_settings` ADD COLUMN `contact_hero_media_file_id` INTEGER NULL;

ALTER TABLE `site_settings` ADD CONSTRAINT `site_settings_contact_hero_media_file_id_fkey`
FOREIGN KEY (`contact_hero_media_file_id`) REFERENCES `media_files`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
