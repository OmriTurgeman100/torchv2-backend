create table users (
    id serial primary key,
    username varchar(50) unique not null,
    password text not null,
    role text default 'guest'
);

create table user_images (
    id serial primary key,
    user_id integer references users(id) on delete cascade,
    image_url text not null default 'default_profile.png',
    uploaded_at timestamp default now()
);
