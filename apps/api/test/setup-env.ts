process.env.NODE_ENV = "test";
process.env.PUBLIC_SITE_URL = "https://indobraga.com";
process.env.PUBLIC_MEDIA_URL = "https://media.indobraga.com";
process.env.MEDIA_STORAGE_ENV = "dev";
process.env.STORAGE_DRIVER = "local";
process.env.STORAGE_LOCAL_ROOT = ".local-storage";
process.env.EMAIL_PROVIDER_MODE = "mock";
process.env.CREDENTIAL_ENCRYPTION_KEY = "test-credential-encryption-key-for-e2e-only";
process.env.NOTIFICATION_EMAIL_ENABLED = "false";
// Disable the in-app email scheduler/auto-drain in tests so delivery is driven
// only by explicit worker-tick calls (deterministic).
process.env.EMAIL_WORKER_POLL_MS = "0";
