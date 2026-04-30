-- Run this in the Supabase SQL editor to set up your database

-- Writing entries
create table writing_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  original text not null,
  polished text not null,
  tags text[] default '{}',
  notes text,
  created_at timestamptz default now()
);
alter table writing_entries enable row level security;
create policy "Users manage own writing" on writing_entries
  for all using (auth.uid() = user_id);

-- Vocab / flashcards
create table vocab_cards (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  word text not null,
  meaning_zh text not null,
  example text,
  next_review date default current_date,
  interval integer default 1,
  ease_factor numeric default 2.5,
  repetitions integer default 0,
  created_at timestamptz default now()
);
alter table vocab_cards enable row level security;
create policy "Users manage own vocab" on vocab_cards
  for all using (auth.uid() = user_id);

-- Think in English drill sessions
create table drill_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  prompt text not null,
  transcript text,
  duration_seconds integer,
  created_at timestamptz default now()
);
alter table drill_sessions enable row level security;
create policy "Users manage own drills" on drill_sessions
  for all using (auth.uid() = user_id);

-- Speaking sessions
create table speaking_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  mode text check (mode in ('read_aloud', 'shadowing', 'pronunciation')) not null,
  accuracy_score numeric,
  source_text text,
  created_at timestamptz default now()
);
alter table speaking_sessions enable row level security;
create policy "Users manage own speaking" on speaking_sessions
  for all using (auth.uid() = user_id);

-- Phrase bank
create table phrase_bank (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  phrase text not null,
  context text,
  source text,
  created_at timestamptz default now()
);
alter table phrase_bank enable row level security;
create policy "Users manage own phrases" on phrase_bank
  for all using (auth.uid() = user_id);
