import psycopg2
from config import database_config

def insert_root_nodes(amount):
    try:
        postgres = psycopg2.connect(**database_config)
        curor = postgres.cursor()

        for number in range(0,amount):
            name = f"node {number}"
            desc = f"desc {number}"
            curor.execute("insert into nodes (title, description) values (%s, %s)", (name, desc))

        postgres.commit()
        

    except Exception as e:
        print(e)
    

insert_root_nodes(30)