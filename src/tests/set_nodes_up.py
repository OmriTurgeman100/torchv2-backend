import psycopg2
from database_config import database_config

def set_nodes_to_be_expired():
    try:
        postgres = psycopg2.connect(**database_config)
        cur = postgres.cursor()

        cur.execute("select * from nodes")

        nodes = cur.fetchall()


        for node in nodes:
            node_id = node[0]

            cur.execute("UPDATE nodes SET status = 'up' WHERE node_id = %s", (node_id,))

        postgres.commit()
        

    except Exception as e:
        print(e)
    

set_nodes_to_be_expired()