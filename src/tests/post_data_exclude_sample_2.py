import psycopg2
from database_config import database_config
import requests


def post_data_to_reports_exclude_report_id_sample_2():
    try:
        postgres = psycopg2.connect(**database_config)
        curor = postgres.cursor()
        
        curor.execute("select distinct(report_id) from reports;")
        distinct_reports = curor.fetchall()

        token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX25hbWUiOiJhZG1pbiIsInVzZXJfaWQiOjE0NiwidXNlcl9yb2xlIjoiZ3Vlc3QiLCJpYXQiOjE3Mzk3MjgyNjQsImV4cCI6MTczOTk4NzQ2NH0.3DGA--mXmqLcF3sMWhy_lXlAYbEvkab7sSqG3aPLW_o'

        while True:
            for report in distinct_reports:
                if report[0] != 'sample 2':
                    body = {
                        "report_id": report[0],
                        "title": report[0],
                        "description": f"{report[0]} description",
                        "value": 60,
              
                    }   

                    print(body)

                    response = requests.post("http://localhost:3000/api/v1/reports/nodes/BlackBox", json=(body), headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {token}' })

                    print(response.status_code)

                
    except Exception as e:
        print(e)


post_data_to_reports_exclude_report_id_sample_2()