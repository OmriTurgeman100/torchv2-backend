import psycopg2
from database_config import database_config
import requests

def post_data_to_reports_exclude():
    try:
        postgres = psycopg2.connect(**database_config)
        curor = postgres.cursor()
        
        curor.execute("select distinct(report_id) from reports;")
        distinct_reports = curor.fetchall()

        token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX25hbWUiOiJhZG1pbiIsInVzZXJfaWQiOjE0NiwidXNlcl9yb2xlIjoiZ3Vlc3QiLCJpYXQiOjE3Mzk5OTE1NjQsImV4cCI6MTc0MDI1MDc2NH0.tXSjkBMG_RAQPcQAVzS6Z27FDkevwwWW-0zCg9E3l2Q'

        while True:
            for report in distinct_reports:
                if report[0] != 'sample 500':
                    body = {
                        "report_id": report[0],
                        "title": report[0],
                        "description": f"{report[0]} description",
                        "value": 30,
                    }   
                    print(body)

                    response = requests.post("http://localhost:3000/api/v1/reports/nodes/BlackBox", json=(body), headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {token}' })

                    print(response.status_code)

    except Exception as e:
        print(e)


post_data_to_reports_exclude()