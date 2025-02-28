import psycopg2
import random
from datetime import datetime, timedelta
from config import database_config

conn = psycopg2.connect(**database_config)
cursor = conn.cursor()

# Function to insert data
def insert_data(report_id, parent_id, title, description, value, excluded, timestamp):
    cursor.execute("""
        INSERT INTO reports (report_id, parent, title, description, value, excluded, time)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, (report_id, parent_id, title, description, value, excluded, timestamp))
    conn.commit()

# Define parameters
report_id = 'sample 1'
parent_id = 1618
title = 'sample 1'
description = 'test description'
excluded = False

# Current time
now = datetime.now()

# Function to simulate realistic CPU usage
def simulate_cpu_usage(previous_value):
    # Simulate CPU usage with slight changes
    change = random.uniform(-3, 3)  # Small change to avoid sharp fluctuations
    new_value = previous_value + change

    # Keep the CPU usage within 0 to 100 range
    new_value = max(0, min(100, new_value))

    # Occasionally simulate a larger spike for realism (e.g., for load)
    if random.random() < 0.05:  # 5% chance of spike
        spike = random.uniform(40, 60)
        new_value = min(100, spike)  # Maximum CPU usage cannot exceed 100
    return new_value

# Insert data for the last 7 days (starting from a random CPU usage value)
previous_cpu_usage = random.uniform(10, 40)  # Start with a reasonable CPU usage
for i in range(7 * 24 * 60 // 5):  # 7 days with 5-minute intervals
    timestamp = now - timedelta(minutes=5 * i)
    cpu_usage = simulate_cpu_usage(previous_cpu_usage)
    insert_data(report_id, parent_id, title, description, round(cpu_usage), excluded, timestamp)
    previous_cpu_usage = cpu_usage

# Insert data for the last 3 days (starting from the last recorded value)
previous_cpu_usage = random.uniform(10, 40)  # Start with a reasonable CPU usage
for i in range(3 * 24 * 60 // 5):  # 3 days with 5-minute intervals
    timestamp = now - timedelta(minutes=5 * i)
    cpu_usage = simulate_cpu_usage(previous_cpu_usage)
    insert_data(report_id, parent_id, title, description, round(cpu_usage), excluded, timestamp)
    previous_cpu_usage = cpu_usage

# Insert data for the last 24 hours (starting from the last recorded value)
previous_cpu_usage = random.uniform(10, 40)  # Start with a reasonable CPU usage
for i in range(24 * 60 // 5):  # 1 day with 5-minute intervals
    timestamp = now - timedelta(minutes=5 * i)
    cpu_usage = simulate_cpu_usage(previous_cpu_usage)
    insert_data(report_id, parent_id, title, description, round(cpu_usage), excluded, timestamp)
    previous_cpu_usage = cpu_usage

# Close the cursor and connection
cursor.close()
conn.close()

print("Data inserted successfully!")