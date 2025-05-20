-- Create api_keys table
create table if not exists public.api_keys (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    key text not null,
    user_id uuid not null references auth.users(id) on delete cascade,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.api_keys enable row level security;

-- Create policies
create policy "Users can view their own api keys"
    on public.api_keys
    for select
    using (auth.uid() = user_id);

create policy "Users can create their own api keys"
    on public.api_keys
    for insert
    with check (auth.uid() = user_id);

create policy "Users can delete their own api keys"
    on public.api_keys
    for delete
    using (auth.uid() = user_id);

-- Create index for faster lookups
create index api_keys_user_id_idx on public.api_keys(user_id);
create index api_keys_key_idx on public.api_keys(key);

-- Add updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger handle_api_keys_updated_at
    before update on public.api_keys
    for each row
    execute procedure public.handle_updated_at(); 