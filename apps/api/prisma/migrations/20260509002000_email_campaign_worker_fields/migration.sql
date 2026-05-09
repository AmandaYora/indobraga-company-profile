-- Add worker claim and fatal error fields for campaign processing.
ALTER TABLE `email_campaigns`
  ADD COLUMN `locked_at` DATETIME(3) NULL,
  ADD COLUMN `last_error` TEXT NULL;
