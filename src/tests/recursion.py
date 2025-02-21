import requests
import time

def recursion():
    try:

        token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX25hbWUiOiJhZG1pbiIsInVzZXJfaWQiOjE0NiwidXNlcl9yb2xlIjoiZ3Vlc3QiLCJpYXQiOjE3Mzk5OTE1NjQsImV4cCI6MTc0MDI1MDc2NH0.tXSjkBMG_RAQPcQAVzS6Z27FDkevwwWW-0zCg9E3l2Q'



        response = requests.get("http://localhost:3000/api/v1/reports/nodes/173", headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'})

        print(response.text)

       

    except Exception as e:
        print(e)


recursion()