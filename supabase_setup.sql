-- ══════════════════════════════════════════════════════
-- PhaGenome — Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ══════════════════════════════════════════════════════

-- 1. JOBS TABLE — tracks every analysis
CREATE TABLE IF NOT EXISTS jobs (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id                TEXT UNIQUE NOT NULL,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  status                TEXT DEFAULT 'queued',
  -- Sequence info
  sequence_header       TEXT,
  sequence_length       INTEGER,
  gc_percent            NUMERIC(5,2),
  seq_count             INTEGER DEFAULT 1,
  -- BLAST
  blast_top_hit         TEXT,
  blast_taxonomy        TEXT,
  blast_hits            JSONB,
  blast_rid             TEXT,
  -- Lifestyle
  lifestyle             TEXT,
  lifestyle_confidence  NUMERIC(5,2),
  lifestyle_evidence    JSONB,
  -- Annotation
  orf_count             INTEGER,
  orf_functional        INTEGER,
  annotation_orfs       JSONB,
  -- tRNA
  trna_count            INTEGER,
  trna_data             JSONB,
  -- Safety
  safety_overall        TEXT,
  amr_hits              INTEGER DEFAULT 0,
  toxin_hits            INTEGER DEFAULT 0,
  safety_data           JSONB,
  -- Galaxy tracking
  galaxy_history_id     TEXT,
  galaxy_dataset_id     TEXT,
  galaxy_pharokka_job   TEXT,
  galaxy_trna_job       TEXT,
  -- Error
  error_message         TEXT
);

-- 2. BENCHMARK TABLE — 1000 genome validation
CREATE TABLE IF NOT EXISTS benchmark_genomes (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  accession             TEXT UNIQUE NOT NULL,
  organism              TEXT,
  host                  TEXT,
  host_group            TEXT,
  genome_size           INTEGER,
  gc_percent            NUMERIC(5,2),
  ncbi_orf_count        INTEGER,
  ncbi_trna_count       INTEGER,
  ncbi_lifestyle        TEXT,
  phagenome_orf_count   INTEGER,
  phagenome_trna_count  INTEGER,
  phagenome_lifestyle   TEXT,
  orf_sensitivity       NUMERIC(5,3),
  orf_precision         NUMERIC(5,3),
  f1_score              NUMERIC(5,3),
  trna_sensitivity      NUMERIC(5,3),
  lifestyle_correct     BOOLEAN,
  processing_time_sec   INTEGER,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 3. USAGE STATS — anonymous analytics
CREATE TABLE IF NOT EXISTS usage_stats (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date          DATE DEFAULT CURRENT_DATE,
  analyses_run  INTEGER DEFAULT 1,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── ROW LEVEL SECURITY ──
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE benchmark_genomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_stats ENABLE ROW LEVEL SECURITY;

-- Jobs: public can insert and read
CREATE POLICY "Public insert jobs"
  ON jobs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read jobs"
  ON jobs FOR SELECT USING (true);
CREATE POLICY "Public update jobs"
  ON jobs FOR UPDATE USING (true);

-- Benchmark: read only
CREATE POLICY "Public read benchmark"
  ON benchmark_genomes FOR SELECT USING (true);

-- Usage: insert and read
CREATE POLICY "Public insert usage"
  ON usage_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read usage"
  ON usage_stats FOR SELECT USING (true);

-- ── INDEXES for performance ──
CREATE INDEX IF NOT EXISTS idx_jobs_job_id ON jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_benchmark_host ON benchmark_genomes(host_group);
CREATE INDEX IF NOT EXISTS idx_benchmark_accession ON benchmark_genomes(accession);

-- ── VERIFY ──
SELECT 'PhaGenome database setup complete!' as message;
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
