-- Add AI first impression columns (idempotent)
alter table public.submissions
  add column if not exists first_impression jsonb,
  add column if not exists score int;

-- Optional: backfill clamp for any legacy inconsistent scores
update public.submissions
set score = case
              when (first_impression->>'score')::int > 98 then 98
              else (first_impression->>'score')::int
            end
where first_impression ? 'score' and score is null;

-- Index for monthly aggregation including score
