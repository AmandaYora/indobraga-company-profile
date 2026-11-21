-- QA IB-01: the public WhatsApp number was stored in local format ("085223000039").
-- wa.me reads a leading 0 as part of the country code, so chats opened to a
-- Hong Kong number (+852). Convert to the international form ("6285223000039").
-- Idempotent: rows already in international form are left untouched.
UPDATE `site_settings`
SET `whatsapp` = CONCAT('62', SUBSTRING(REGEXP_REPLACE(`whatsapp`, '[^0-9]', ''), 2))
WHERE REGEXP_REPLACE(`whatsapp`, '[^0-9]', '') LIKE '0%'
  AND REGEXP_REPLACE(`whatsapp`, '[^0-9]', '') NOT LIKE '00%';

-- Strip separators ("+62 852-2300-0039" -> "6285223000039") on the remaining rows.
UPDATE `site_settings`
SET `whatsapp` = REGEXP_REPLACE(`whatsapp`, '[^0-9]', '')
WHERE `whatsapp` REGEXP '[^0-9]';
