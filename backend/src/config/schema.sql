create type user_role as enum ('STUDENT', 'ADMIN');

create type assignment_target_type as enum ('ALL', 'GROUP');


create table users (
    id bigserial primary key,
    name varchar(100) not null,
    email varchar(255) unique not null,
    password varchar(255) not null,
    role user_role default 'STUDENT',
    created_at timestamptz default current_timestamp,
    updated_at timestamptz default current_timestamp
);


create table groups (
    id bigserial primary key,
    name varchar(100) not null,
    created_by bigint not null references users(id),
    created_at timestamptz default current_timestamp,
    updated_at timestamptz default current_timestamp
);


create table group_members (
    group_id bigint references groups(id) on delete cascade,
    student_id bigint references users(id) on delete cascade,
    joined_at timestamptz default current_timestamp,

    primary key (group_id, student_id)
);


create table assignments (
    id bigserial primary key,
    title varchar(200) not null,
    description text,
    due_date timestamptz not null,
    onedrive_url text not null,
    target_type assignment_target_type not null,
    created_by bigint not null references users(id),
    created_at timestamptz default current_timestamp,
    updated_at timestamptz default current_timestamp
);


create table assignment_groups (
    assignment_id bigint references assignments(id) on delete cascade,
    group_id bigint references groups(id) on delete cascade,

    primary key (assignment_id, group_id)
);


create table submissions (
    id bigserial primary key,
    assignment_id bigint references assignments(id) on delete cascade,
    student_id bigint references users(id) on delete cascade,
    confirmed_at timestamptz default current_timestamp,

    unique (assignment_id, student_id)
);