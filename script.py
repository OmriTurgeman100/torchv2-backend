import requests
import time

def http(username):
    try:

        start_time = time.time()

        body = {
            "username": username,
            "password": "random_password"
        }

        response = requests.post("http://localhost:3000/api/v1/auth/login", json=body)

        end_time = time.time()

        total_time = end_time - start_time

        print(f"the time it takes for user {username} is {total_time}, status code is {response.status_code, response.text}")


    except Exception as e:
        print(e)


usernames = ['lucas', 'emma', 'oliver', 'admin', 'liam', 'sofia', 'noah', 'ava', 'elijah', 'isla']

for username in usernames:
    http(username)