import psycopg2
from config import database_config, token
import requests
import time

def post_data_to_reports_exclude():
    try:
        postgres = psycopg2.connect(**database_config)
        curor = postgres.cursor()
        
        curor.execute("select distinct(report_id) from reports;")
        distinct_reports = curor.fetchall()

        while True:
            for report in distinct_reports:
                if report[0] != 'empty':
                    body = {
                        "report_id": report[0],
                        "title": report[0],
                        "description": f"{report[0]} description",
                        "value": 0.01,
                    }   
                    print(body)

                    response = requests.post("http://localhost:3000/api/v1/reports/nodes/BlackBox", json=(body), headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {token}' })

                    print(response.status_code, response.text)

                time.sleep(2)

    except Exception as e:
        print(e)


post_data_to_reports_exclude()