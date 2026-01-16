-- SERHUB Database Schema for Supabase
-- Run this in your Supabase SQL Editor
-- Tables are prefixed with serhub_ to coexist with other apps in the Mika project

-- Users table
CREATE TABLE IF NOT EXISTS serhub_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'Team Member',
  avatar TEXT
);

-- Sections table (project roadmap steps)
CREATE TABLE IF NOT EXISTS serhub_sections (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  progress INTEGER DEFAULT 0,
  "docsUrl" TEXT,
  "driveFolderUrl" TEXT,
  "documentsExpected" INTEGER DEFAULT 0,
  "documentsUploaded" INTEGER DEFAULT 0,
  "tasksTotal" INTEGER DEFAULT 0,
  "tasksOpen" INTEGER DEFAULT 0,
  "nextDeadline" TEXT
);

-- Tasks table
CREATE TABLE IF NOT EXISTS serhub_tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  "sectionId" TEXT REFERENCES serhub_sections(id),
  "assignedTo" TEXT,
  author TEXT,
  "dueDate" TEXT,
  duration INTEGER,
  progress INTEGER DEFAULT 0
);

-- Documents table
CREATE TABLE IF NOT EXISTS serhub_documents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  url TEXT,
  "lastUpdated" TEXT,
  status TEXT DEFAULT 'Missing'
);

-- Knowledge table
CREATE TABLE IF NOT EXISTS serhub_knowledge (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT,
  summary TEXT,
  tags TEXT[],
  link TEXT
);

-- Events table (calendar)
CREATE TABLE IF NOT EXISTS serhub_events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date TEXT,
  type TEXT,
  "sectionId" TEXT REFERENCES serhub_sections(id)
);

-- Enable Row Level Security on all tables
ALTER TABLE serhub_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE serhub_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE serhub_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE serhub_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE serhub_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE serhub_events ENABLE ROW LEVEL SECURITY;

-- Allow all operations (single-tenant app, simple RLS for now)
-- You can refine these policies later for more granular control
CREATE POLICY "Allow all for serhub_users" ON serhub_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for serhub_sections" ON serhub_sections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for serhub_tasks" ON serhub_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for serhub_documents" ON serhub_documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for serhub_knowledge" ON serhub_knowledge FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for serhub_events" ON serhub_events FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_serhub_tasks_sectionid ON serhub_tasks("sectionId");
CREATE INDEX IF NOT EXISTS idx_serhub_users_email ON serhub_users(email);
CREATE INDEX IF NOT EXISTS idx_serhub_events_sectionid ON serhub_events("sectionId");
