# rules evaluation engine 
nodes = [
    {
        "node_id": 1,
        "status": "up",
        "excluded": False
    },
    {
        "node_id": 2,
        "status": "up",
        "excluded": False
    },
    {
        "node_id": 3,
        "status": "up",
        "excluded": True
    }
]

nodes_rules = [
    {
        "node_id": 1,
        "status": "up",

    },
    {
        "node_id": 2,
        "status": "up",
       
    },
    {
        "node_id": 3,
        "status": "down",
    },
]


# * and operator 
and_results = []

# case_matched_and = None
for node in nodes:
    for rule in nodes_rules:
        if node["node_id"] == rule["node_id"]:
            if node["status"] == rule["status"]:
                # None
                and_results.append(True)

                # print("case matched")
                
                # print(f"node id {node["node_id"]} and node status {node["status"]} == rule id {rule["node_id"]} and rule status {rule["status"]}")
            else: 
                # print(f"node id {node["node_id"]} and node status {node["status"]} == rule id {rule["node_id"]} and rule status {rule["status"]}")
                # print("no")

                and_results.append(False)
                break

case_matched_and = all(and_results)

print(f"case is {case_matched_and}")
# print(f"case_matched for and operator {case_matched_and}")

# if case_matched_and == True:
#     print("case matched is true")
# else:
#     print("case matched is false")


# * or operator 
# case_matched_or = False

or_results = []

for node in nodes:
    for rule in nodes_rules:
        if node["node_id"] == rule["node_id"]:
            if node["status"] == rule["status"]:
                or_results.append(True)

                # # print("case matched")
                
                # # print(f"node id {node["node_id"]} and node status {node["status"]} == rule id {rule["node_id"]} and rule status {rule["status"]}")
                # case_matched_or = True
                # break
            else: 
                or_results.append(False)
                # print(f"node id {node["node_id"]} and node status {node["status"]} == rule id {rule["node_id"]} and rule status {rule["status"]}")
                # print("no")

# * should test in production.
case_matched_or = any(or_results)

for rule in or_results:
    print(rule)

               
print(f"case_matched for or operator {case_matched_or}")

if case_matched_or == True:
    print("case matched is true")
else:
    print("case matched is false")


# ! ready for tests. 

# TODO make a data generator for further testing.

# * using this method might have worse performance