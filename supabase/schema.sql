-- Run this once in the Supabase SQL editor (Project > SQL Editor > New query)
-- to set up the poll-app schema, plus Row Level Security policies.
--
-- No auth, and no vote-locking: anyone can vote for the same option any
-- number of times. Every table is readable and insertable by anyone (the
-- `anon` role). Updates and deletes are never allowed from the client -
-- there's simply no policy for them, and RLS defaults to deny.

create table polls (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text not null,
  deadline timestamptz,
  created_at timestamptz not null default now()
);

create table questions (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references polls(id) on delete cascade,
  text text not null,
  allow_multiple boolean not null default false,
  sort_order int not null default 0
);

create table poll_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  text text not null,
  sort_order int not null default 0
);

create table votes (
  id uuid primary key default gen_random_uuid(),
  poll_option_id uuid not null references poll_options(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- security_invoker: run with the querying role's permissions, so this view
-- respects the RLS policies below instead of the view owner's.
create view poll_results with (security_invoker = true) as
select po.id as poll_option_id, po.question_id, q.poll_id, po.text, count(v.id) as vote_count
from poll_options po
join questions q on q.id = po.question_id
left join votes v on v.poll_option_id = po.id
group by po.id, po.question_id, q.poll_id, po.text;

-- Row Level Security

alter table polls enable row level security;
alter table questions enable row level security;
alter table poll_options enable row level security;
alter table votes enable row level security;

create policy "Anyone can read polls" on polls for select using (true);
create policy "Anyone can create polls" on polls for insert with check (true);

create policy "Anyone can read questions" on questions for select using (true);
create policy "Anyone can create questions" on questions for insert with check (true);

create policy "Anyone can read poll options" on poll_options for select using (true);
create policy "Anyone can create poll options" on poll_options for insert with check (true);

create policy "Anyone can read votes" on votes for select using (true);
create policy "Anyone can create votes" on votes for insert with check (true);

-- Realtime: Postgres Changes only fires on tables, not views, so the client
-- subscribes to `votes` inserts directly and recomputes results from that.
alter publication supabase_realtime add table votes;
