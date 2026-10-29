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

    CREATE TABLE IF NOT EXISTS annathanam_payments (
      order_id TEXT PRIMARY KEY,
      cf_order_id TEXT,
      amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 1),
      currency TEXT NOT NULL DEFAULT 'INR',
      donor_name TEXT NOT NULL,
      donor_email TEXT NOT NULL DEFAULT '',
      donor_phone TEXT NOT NULL,
      donor_country TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'CREATED',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS annathanam_payments_created_idx
      ON annathanam_payments (created_at DESC);

    ALTER TABLE annathanam_payments ADD COLUMN IF NOT EXISTS donor_country TEXT NOT NULL DEFAULT '';

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
