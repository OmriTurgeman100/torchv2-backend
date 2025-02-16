import psycopg2

db_config = {
    "dbname": "postgres",
    "user": "postgres",
    "password": "postgres",
    "host": "localhost",
    "port": "5432"  # Default PostgreSQL port is 5432
}

def set_nodes_to_be_expired():
    try:
        postgres = psycopg2.connect(**db_config)
        cur = postgres.cursor()

        cur.execute("select * from nodes")

        nodes = cur.fetchall()


        for node in nodes:
            node_id = node[0]

            cur.execute("UPDATE nodes SET status = 'expired' WHERE node_id = %s", (node_id,))

        postgres.commit()
        

    except Exception as e:
        print(e)
    

set_nodes_to_be_expired()