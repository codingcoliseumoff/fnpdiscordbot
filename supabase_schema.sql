# Perc Fermé Network - Supabase Schema

Run this SQL in your Supabase SQL Editor to set up the database for the bot.

/* Enable UUID extension */
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

/* Users Table */
CREATE TABLE IF NOT EXISTS public.users (
    user_id TEXT PRIMARY KEY,
    username TEXT,
    xp INTEGER DEFAULT 0,
    money BIGINT DEFAULT 1000000,
    history_points INTEGER DEFAULT 0,
    current_league INTEGER DEFAULT 1,
    fantasy_points INTEGER DEFAULT 0,
    last_fantasy_claim TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

/* Teams Table */
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_user_id TEXT REFERENCES public.users(user_id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#ffffff',
    logo_url TEXT,
    website_name TEXT,
    aero FLOAT DEFAULT 20.0,
    chassis FLOAT DEFAULT 20.0,
    pit_crew FLOAT DEFAULT 20.0,
    durability FLOAT DEFAULT 20.0,
    engine_power FLOAT DEFAULT 20.0,
    money BIGINT DEFAULT 100000,
    points INTEGER DEFAULT 0,
    tier INTEGER DEFAULT 1,
    is_ai BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

/* Drivers Table */
CREATE TABLE IF NOT EXISTS public.drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    pace FLOAT DEFAULT 50.0,
    racecraft FLOAT DEFAULT 50.0,
    consistency FLOAT DEFAULT 50.0,
    experience FLOAT DEFAULT 1.0,
    tyre_management FLOAT DEFAULT 50.0,
    wet_weather_skill FLOAT DEFAULT 50.0,
    aggression FLOAT DEFAULT 50.0,
    rating FLOAT,
    is_real BOOLEAN DEFAULT FALSE, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

/* Create Trigger to update rating */
CREATE OR REPLACE FUNCTION update_driver_rating() RETURNS TRIGGER AS $$
BEGIN
  NEW.rating := (NEW.pace + NEW.racecraft + NEW.consistency + NEW.experience + NEW.tyre_management + NEW.wet_weather_skill) / 6.0;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_driver_rating
BEFORE INSERT OR UPDATE ON public.drivers
FOR EACH ROW EXECUTE FUNCTION update_driver_rating();

/* Server Tournaments */
CREATE TABLE IF NOT EXISTS public.server_tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    server_id TEXT NOT NULL,
    status TEXT DEFAULT 'active', 
    current_round INTEGER DEFAULT 0,
    total_rounds INTEGER DEFAULT 24,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

/* Race Results */
CREATE TABLE IF NOT EXISTS public.race_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES public.users(user_id),
    server_id TEXT,
    team_name TEXT,
    position INTEGER,
    points INTEGER,
    track_name TEXT,
    session_type TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

/* Lobbies */
CREATE TABLE IF NOT EXISTS public.lobbies (
    code TEXT PRIMARY KEY,
    host_id TEXT REFERENCES public.users(user_id),
    server_id TEXT,
    status TEXT DEFAULT 'waiting',
    players JSONB DEFAULT '[]',
    max_players INTEGER DEFAULT 10,
    use_ai BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

/* Server Settings */
CREATE TABLE IF NOT EXISTS public.server_settings (
    server_id TEXT PRIMARY KEY,
    spawn_channel_id TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

/* Spawns Table */
CREATE TABLE IF NOT EXISTS public.spawns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    server_id TEXT REFERENCES public.server_settings(server_id),
    driver_id TEXT,
    driver_name TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

/* User Dex Table */
CREATE TABLE IF NOT EXISTS public.user_dex (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES public.users(user_id),
    driver_id TEXT,
    driver_name TEXT,
    collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

/* Universal Drivers Extension */
ALTER TABLE public.drivers 
ADD COLUMN IF NOT EXISTS trait TEXT,
ADD COLUMN IF NOT EXISTS reliability FLOAT DEFAULT 80.0,
ADD COLUMN IF NOT EXISTS tier INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS rarity TEXT DEFAULT 'Standard',
ADD COLUMN IF NOT EXISTS salary BIGINT DEFAULT 50000,
ADD COLUMN IF NOT EXISTS contract_laps INTEGER DEFAULT 0;

/* Team Development Branching */
ALTER TABLE public.teams
ADD COLUMN IF NOT EXISTS reliability FLOAT DEFAULT 20.0,
ADD COLUMN IF NOT EXISTS development_path TEXT DEFAULT 'Balanced', /* Balanced, HighSpeed, Cornering */
ADD COLUMN IF NOT EXISTS sponsor_id TEXT,
ADD COLUMN IF NOT EXISTS branding_config JSONB DEFAULT '{}';

/* Contracts Table */
CREATE TABLE IF NOT EXISTS public.contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES public.users(user_id) ON DELETE CASCADE,
    driver_id TEXT,
    salary BIGINT,
    laps_remaining INTEGER,
    status TEXT DEFAULT 'active'
);

/* Sponsorships Table */
CREATE TABLE IF NOT EXISTS public.sponsorships (
    id TEXT PRIMARY KEY,
    name TEXT,
    bonus_money BIGINT,
    requirements JSONB
);

/* User Sponsorships */
CREATE TABLE IF NOT EXISTS public.user_sponsors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES public.users(user_id) ON DELETE CASCADE,
    sponsor_id TEXT REFERENCES public.sponsorships(id),
    laps_remaining INTEGER DEFAULT 0,
    performance_bonus FLOAT DEFAULT 1.0,
    signed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

/* Legend Mode & Global Rankings */
CREATE TABLE IF NOT EXISTS public.global_rankings (
    user_id TEXT PRIMARY KEY REFERENCES public.users(user_id),
    global_points INTEGER DEFAULT 0,
    server_represented TEXT,
    world_rank INTEGER
);

/* Indexes */
CREATE INDEX IF NOT EXISTS idx_teams_owner ON public.teams(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_drivers_team ON public.drivers(team_id);
CREATE INDEX IF NOT EXISTS idx_users_money ON public.users(money DESC);
CREATE INDEX IF NOT EXISTS idx_users_xp ON public.users(xp DESC);
CREATE INDEX IF NOT EXISTS idx_user_dex ON public.user_dex(user_id);
