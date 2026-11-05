import pg from 'pg'
import { config } from './config.js'

const { Pool } = pg

export const pool = new Pool({ connectionString: config.databaseUrl })

const categories = [
  ['guru', 'Guru', 'Moments of guidance and spiritual presence.', 1],
  ['online-classes', 'Online Classes', 'Shared learning and online spiritual practice.', 2],
  ['annathanam', 'Annathanam', 'Service through food, care and compassion.', 3],
  ['others', 'Others', 'Gatherings, journeys and community moments.', 4],
]

export async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS photo_categories (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS photos (
      id BIGSERIAL PRIMARY KEY,
      category_id TEXT NOT NULL REFERENCES photo_categories(id) ON DELETE RESTRICT,
      file_name TEXT NOT NULL UNIQUE,
      original_name TEXT NOT NULL,
      alt_text TEXT NOT NULL DEFAULT '',
      width INTEGER,
      height INTEGER,
      file_size INTEGER NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS photos_category_created_idx
      ON photos (category_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS youtube_videos (
      id BIGSERIAL PRIMARY KEY,
      youtube_id TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS youtube_videos_created_idx
      ON youtube_videos (created_at DESC);

    CREATE TABLE IF NOT EXISTS homepage_youtube_videos (
      id BIGSERIAL PRIMARY KEY,
      youtube_id TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS homepage_youtube_videos_created_idx
      ON homepage_youtube_videos (created_at DESC);

    CREATE TABLE IF NOT EXISTS guru_interview_videos (
      id BIGSERIAL PRIMARY KEY,
      youtube_id TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS guru_interview_videos_created_idx
      ON guru_interview_videos (created_at DESC, id DESC);

    CREATE TABLE IF NOT EXISTS upcoming_activities (
      id BIGSERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
      file_name TEXT NOT NULL UNIQUE,
      original_name TEXT NOT NULL,
      file_size BIGINT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS upcoming_activities_created_idx
      ON upcoming_activities (created_at DESC, id DESC);

    CREATE TABLE IF NOT EXISTS upcoming_classes (
      id BIGSERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      file_name TEXT NOT NULL UNIQUE,
      original_name TEXT NOT NULL,
      file_size BIGINT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS upcoming_classes_created_idx
      ON upcoming_classes (created_at DESC, id DESC);

    CREATE TABLE IF NOT EXISTS homepage_ads (
      id BIGSERIAL PRIMARY KEY,
      file_name TEXT NOT NULL UNIQUE,
      original_name TEXT NOT NULL,
      file_size BIGINT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS homepage_ads_created_idx
      ON homepage_ads (created_at ASC, id ASC);

    CREATE TABLE IF NOT EXISTS quote_images (
      id BIGSERIAL PRIMARY KEY,
      file_name TEXT NOT NULL UNIQUE,
      original_name TEXT NOT NULL,
      file_size BIGINT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS annathanam_contributions (
      id BIGSERIAL PRIMARY KEY,
      quote TEXT NOT NULL,
      media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
      file_name TEXT NOT NULL UNIQUE,
      original_name TEXT NOT NULL,
      file_size BIGINT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS annathanam_contributions_created_idx
      ON annathanam_contributions (created_at ASC, id ASC);

    CREATE TABLE IF NOT EXISTS donation_settings (
      id SMALLINT PRIMARY KEY CHECK (id = 1),
      organization_name TEXT NOT NULL,
      upi_id TEXT NOT NULL,
      bank_name TEXT NOT NULL,
      account_name TEXT NOT NULL,
      account_number TEXT NOT NULL,
      ifsc TEXT NOT NULL,
      branch TEXT NOT NULL,
      account_type TEXT NOT NULL DEFAULT '',
      updated_by TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    INSERT INTO donation_settings
      (id, organization_name, upi_id, bank_name, account_name, account_number, ifsc, branch, account_type)
    VALUES
      (1, 'Brahmam Foundation', 'organization@upi', 'YOUR BANK', 'Brahmam Foundation', '000000000000', 'ABCD0123456', 'YOUR BRANCH', 'Savings')
    ON CONFLICT (id) DO NOTHING;

    CREATE TABLE IF NOT EXISTS donations (
      id BIGSERIAL PRIMARY KEY,
      donor_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 1 AND amount <= 500000),
      payment_method TEXT NOT NULL CHECK (payment_method IN ('UPI', 'BANK_TRANSFER')),
      utr_number TEXT NOT NULL,
      message TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'VERIFIED', 'REJECTED')),
      verified_by TEXT,
      verified_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS donations_utr_unique_idx ON donations (LOWER(utr_number));
    CREATE INDEX IF NOT EXISTS donations_status_idx ON donations (status);
    CREATE INDEX IF NOT EXISTS donations_created_idx ON donations (created_at DESC);

    CREATE TABLE IF NOT EXISTS class_registrations (
      id BIGSERIAL PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      city TEXT NOT NULL DEFAULT '',
      country TEXT NOT NULL,
      message TEXT NOT NULL DEFAULT '',
      consent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS class_registrations_created_idx
      ON class_registrations (created_at DESC, id DESC);

    ALTER TABLE class_registrations ADD COLUMN IF NOT EXISTS class_id BIGINT;
    ALTER TABLE class_registrations ADD COLUMN IF NOT EXISTS class_title TEXT NOT NULL DEFAULT '';
    ALTER TABLE class_registrations ADD COLUMN IF NOT EXISTS city TEXT NOT NULL DEFAULT '';
    ALTER TABLE class_registrations ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT '';
    ALTER TABLE class_registrations ADD COLUMN IF NOT EXISTS payment_screenshot_file_name TEXT NOT NULL DEFAULT '';
    ALTER TABLE class_registrations ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT '';
    ALTER TABLE class_registrations ADD COLUMN IF NOT EXISTS payment_verified_by TEXT;
    ALTER TABLE class_registrations ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMPTZ;

    CREATE INDEX IF NOT EXISTS class_registrations_payment_status_idx
      ON class_registrations (payment_status, created_at DESC);

    CREATE TABLE IF NOT EXISTS visitor_feedback (
      id BIGSERIAL PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL DEFAULT '',
      rating INTEGER CHECK (rating BETWEEN 1 AND 5),
      message TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS visitor_feedback_created_idx
      ON visitor_feedback (created_at DESC, id DESC);

    CREATE TABLE IF NOT EXISTS published_feedback (
      id BIGSERIAL PRIMARY KEY,
      full_name TEXT NOT NULL,
      role_or_location TEXT NOT NULL DEFAULT '',
      rating INTEGER NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
      message TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS published_feedback_created_idx
      ON published_feedback (created_at DESC, id DESC);

    CREATE TABLE IF NOT EXISTS admin_credentials (
      username TEXT PRIMARY KEY,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS admin_credentials_username_lower_idx
      ON admin_credentials (lower(username));
  `)

  for (const [id, label, description, sortOrder] of categories) {
    await pool.query(
      `INSERT INTO photo_categories (id, label, description, sort_order)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE
       SET label = EXCLUDED.label,
           description = EXCLUDED.description,
           sort_order = EXCLUDED.sort_order`,
      [id, label, description, sortOrder],
    )
  }
}
