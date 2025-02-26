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

create table nodes (
	node_id SERIAL PRIMARY KEY,
	parent INTEGER REFERENCES nodes(node_id) ON DELETE CASCADE,
	title VARCHAR(50) NOT NULL,
	description VARCHAR(50) NOT NULL,
	status VARCHAR(50) DEFAULT 'expired',
    excluded VARCHAR(50) DEFAULT 'false',
	time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

create table reports (
	id SERIAL PRIMARY KEY,
	report_id VARCHAR(50) NOT NULL,
	parent INTEGER REFERENCES nodes(node_id) ON DELETE CASCADE,
	title VARCHAR(50) NOT NULL,
	description VARCHAR(50) NOT NULL,
	value INTEGER,
	excluded VARCHAR(50) DEFAULT 'false',
	time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rules (  
    rule_id SERIAL PRIMARY KEY,
    parent_node_id INTEGER REFERENCES nodes(node_id) ON DELETE CASCADE,
    operator VARCHAR(50) NOT NULL,
    conditions JSONB NOT NULL,  
    action VARCHAR(50) NOT NULL,
    time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 

create table node_templates (
    id serial primary key,
    name varchar(50) unique not null
);

create table nodes_description (
	id serial primary key,
	parent integer references nodes(node_id) not null,
	team text,
	contact text,
	description text not null
);

create table node_comments (
	id serial primary key,
	parent integer references nodes(node_id) ON DELETE CASCADE,
	comment text not null,
	time timestamp default CURRENT_TIMESTAMP
);