import psycopg2
from config import database_config

def insert_root_nodes(amount):
    try:
        postgres = psycopg2.connect(**database_config)
        curor = postgres.cursor()

        for number in range(0,amount):
            report_id = f"report {number}"
            name = f"report {number}"
            desc = f"desc {number}"
            curor.execute("insert into reports (report_id, title, description) values (%s, %s, %s)", (report_id, name, desc))

        postgres.commit()

        print("insereted reports")
        

    except Exception as e:
        print(e)
    

insert_root_nodes(30)