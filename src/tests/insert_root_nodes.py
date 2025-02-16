import psycopg2

db_config = {
    "dbname": "postgres",
    "user": "postgres",
    "password": "postgres",
    "host": "localhost",
    "port": "5432"  
}

def insert_root_nodes(amount):
    try:
        postgres = psycopg2.connect(**db_config)
        cur = postgres.cursor()

        for number in range(0,amount):
            name = f"node {number}"
            desc = f"desc {number}"
            cur.execute("insert into nodes (title, description) values (%s, %s)", (name, desc))

        postgres.commit()
        

    except Exception as e:
        print(e)
    

insert_root_nodes(30)