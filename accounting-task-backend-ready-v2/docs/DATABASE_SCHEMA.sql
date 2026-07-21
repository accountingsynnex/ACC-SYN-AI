-- Suggested PostgreSQL schema for Accounting Task.
-- Adapt naming, identity provider fields and audit conventions to company standards.

create extension if not exists pgcrypto;

create type task_status as enum (
  'assigned', 'in-progress', 'ready-review', 'under-review', 'revision', 'approved'
);
create type task_priority as enum ('low', 'normal', 'high', 'critical');
create type user_role as enum ('staff', 'reviewer', 'teamlead', 'manager');

create table teams (
  id uuid primary key default gen_random_uuid(),
  code varchar(30) not null unique,
  name varchar(160) not null,
  description text,
  color varchar(20),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table users (
  id uuid primary key default gen_random_uuid(),
  external_subject varchar(255) not null unique,
  email varchar(320) not null unique,
  display_name varchar(200) not null,
  role user_role not null,
  team_id uuid references teams(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id),
  code varchar(40) not null,
  name varchar(180) not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(team_id, code),
  unique(team_id, name)
);

create table annual_tasks (
  id uuid primary key default gen_random_uuid(),
  name varchar(220) not null,
  team_id uuid not null references teams(id),
  category_id uuid not null references categories(id),
  frequency varchar(30) not null,
  default_assignee_id uuid references users(id),
  default_reviewer_id uuid references users(id),
  priority task_priority not null default 'normal',
  open_rule text,
  due_rule text,
  checklist_template jsonb not null default '[]'::jsonb,
  required_files jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  task_number varchar(40) not null unique,
  title varchar(300) not null,
  team_id uuid not null references teams(id),
  category_id uuid not null references categories(id),
  assignee_id uuid not null references users(id),
  reviewer_id uuid references users(id),
  annual_task_id uuid references annual_tasks(id),
  accounting_period char(7) not null,
  due_date date not null,
  status task_status not null default 'assigned',
  priority task_priority not null default 'normal',
  is_restricted boolean not null default false,
  version integer not null default 1,
  submitted_at timestamptz,
  created_by uuid not null references users(id),
  updated_by uuid not null references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_scope_idx on tasks(team_id, accounting_period, status);
create index tasks_assignee_idx on tasks(assignee_id, status, due_date);
create index tasks_reviewer_idx on tasks(reviewer_id, status, due_date);

create table task_checklist_items (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  label varchar(500) not null,
  is_required boolean not null default true,
  is_checked boolean not null default false,
  checked_by uuid references users(id),
  checked_at timestamptz,
  sort_order integer not null default 0
);

create table task_files (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  storage_key varchar(700) not null unique,
  original_name varchar(500) not null,
  mime_type varchar(200) not null,
  size_bytes bigint not null,
  file_category varchar(80),
  version integer not null default 1,
  malware_status varchar(30) not null default 'pending',
  uploaded_by uuid not null references users(id),
  uploaded_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table task_activity (
  id bigserial primary key,
  task_id uuid not null references tasks(id) on delete cascade,
  actor_id uuid references users(id),
  action varchar(80) not null,
  previous_value jsonb,
  new_value jsonb,
  reason text,
  created_at timestamptz not null default now()
);

create index task_activity_task_idx on task_activity(task_id, created_at desc);

create table annual_task_generations (
  annual_task_id uuid not null references annual_tasks(id),
  accounting_period char(7) not null,
  generated_task_id uuid not null references tasks(id),
  created_at timestamptz not null default now(),
  primary key(annual_task_id, accounting_period)
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  task_id uuid references tasks(id) on delete cascade,
  notification_type varchar(60) not null,
  title varchar(220) not null,
  message text,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index notifications_user_idx on notifications(user_id, is_read, created_at desc);
