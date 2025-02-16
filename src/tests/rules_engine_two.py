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

case_matched_and = True
for node in nodes:
    for rule in nodes_rules:
        if node["node_id"] == rule["node_id"]:
            if node["status"] == rule["status"]:
                None

                # print("case matched")
                
                # print(f"node id {node["node_id"]} and node status {node["status"]} == rule id {rule["node_id"]} and rule status {rule["status"]}")
            else: 
                # print(f"node id {node["node_id"]} and node status {node["status"]} == rule id {rule["node_id"]} and rule status {rule["status"]}")
                # print("no")

                case_matched_and = False
                break


print(f"case_matched for and operator {case_matched_and}")

if case_matched_and == True:
    print("case matched is true")
else:
    print("case matched is false")


# * or operator 
case_matched_or = False
for node in nodes:
    for rule in nodes_rules:
        if node["node_id"] == rule["node_id"]:
            if node["status"] == rule["status"]:

                # print("case matched")
                
                # print(f"node id {node["node_id"]} and node status {node["status"]} == rule id {rule["node_id"]} and rule status {rule["status"]}")
                case_matched_or = True
                break
            else: 
                None
                # print(f"node id {node["node_id"]} and node status {node["status"]} == rule id {rule["node_id"]} and rule status {rule["status"]}")
                # print("no")

               
print(f"case_matched for or operator {case_matched_or}")

if case_matched_or == True:
    print("case matched is true")
else:
    print("case matched is false")


# ! ready for tests. 

# TODO make a data generator for further testing.
