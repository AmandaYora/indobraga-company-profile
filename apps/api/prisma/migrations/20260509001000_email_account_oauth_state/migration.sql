-- Add OAuth state persistence and connected timestamp for email sender accounts.
ALTER TABLE `email_accounts`
  ADD COLUMN `connected_at` DATETIME(3) NULL;

CREATE TABLE `email_oauth_states` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `state_hash` VARCHAR(128) NOT NULL,
  `admin_user_id` INTEGER NULL,
  `email_hint` VARCHAR(190) NULL,
  `display_name` VARCHAR(190) NULL,
  `expires_at` DATETIME(3) NOT NULL,
  `consumed_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `email_oauth_states_state_hash_key`(`state_hash`),
  INDEX `email_oauth_states_admin_user_id_idx`(`admin_user_id`),
  INDEX `email_oauth_states_expires_at_idx`(`expires_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `email_oauth_states`
  ADD CONSTRAINT `email_oauth_states_admin_user_id_fkey`
  FOREIGN KEY (`admin_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
