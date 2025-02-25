import requests
import time
import uuid

# API URLs
API_URL = "http://localhost:3000/api/v1/reports/nodes"
REPORT_URL = "http://localhost:3000/api/v1/reports/nodes/BlackBox"
RULES_URL = "http://localhost:3000/api/v1/reports/nodes/Rules"
HEADERS = {
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX25hbWUiOiJhZG1pbiIsInVzZXJfaWQiOjE1MywidXNlcl9yb2xlIjoiZ3Vlc3QiLCJpYXQiOjE3NDA1MTU0NDAsImV4cCI6MTc0MDc3NDY0MH0.-oeUp5q3Ucly6cXhnuq4WcCtm98nB35Fxgy87IT-0ns",
    "Content-Type": "application/json"
}

def create_node(title, description, parent=None):
    """Posts a node to the API and returns the node ID."""
    payload = {"title": title, "description": description}
    if parent is not None:
        payload["parent"] = parent
    
    response = requests.post(API_URL, json=payload, headers=HEADERS)
    
    if response.status_code == 201:
        node_data = response.json()["data"]
        print(f"Created node: {node_data}")
        return node_data["node_id"]
    else:
        print(f"Failed to create node: {response.text}")
        return None

def create_report():
    """Creates a standalone report with a unique report ID."""
    unique_report_id = str(uuid.uuid4())[:8]  # Generate a short unique ID
    report_id = f"report_{unique_report_id}"
    payload = {
        "report_id": report_id,
        "title": report_id,
        "description": "test description",
        "value": 70,
        "parent": None
    }
    response = requests.post(REPORT_URL, json=payload, headers=HEADERS)
    
    if response.status_code == 201:
        print(f"Created standalone report: {report_id}")
        return report_id
    else:
        print(f"Failed to create standalone report: {response.text}")
        return None

def attach_report_to_parent(report_id, parent_id):
    """Attaches an existing report to a parent node."""
    payload = {
        "report_id": report_id,
        "title": report_id,
        "description": "test description",
        "value": 70,
        "parent": parent_id
    }
    response = requests.post(REPORT_URL, json=payload, headers=HEADERS)
    
    if response.status_code == 201:
        print(f"Attached report {report_id} to parent {parent_id}")
    else:
        print(f"Failed to attach report: {response.text}")

def create_rule_for_nodes(parent_id, child_node_ids):
    """Creates a rule for a node based on its child nodes."""
    conditions = []
    for node_id in child_node_ids:
        conditions.append({
            "node_id": node_id,
            "value": "up",
            "title": f"Node {node_id} under {parent_id}"
        })
    
    payload = {
        "operator": "and",
        "conditions": conditions,
        "action": "up"
    }
    
    rule_url = f"{RULES_URL}/{parent_id}"
    response = requests.post(rule_url, json=payload, headers=HEADERS)
    
    if response.status_code == 201:
        print(f"Created rule for nodes under {parent_id}")
    else:
        print(f"Failed to create node rule: {response.text}")

def create_hierarchy(root_title, levels, children_per_level):
    """Creates a hierarchical structure of nodes and posts reports at the end."""
    root_ids = []
    for i in range(5):  # Creating multiple root nodes
        root_id = create_node(f"{root_title} {i+1}", "Root node")
        if root_id:
            root_ids.append(root_id)
    
    for root_id in root_ids:
        level_nodes = {0: [root_id]}
        
        for level in range(1, levels + 1):
            level_nodes[level] = []
            for parent_id in level_nodes[level - 1]:
                child_nodes = []
                for i in range(children_per_level):
                    node_title = f"Node L{level}-C{i+1} under {parent_id}"
                    node_id = create_node(node_title, f"Child of {parent_id}", parent=parent_id)
                    if node_id:
                        child_nodes.append(node_id)
                level_nodes[level].extend(child_nodes)
                
                # After creating children, create rules for them
                create_rule_for_nodes(parent_id, child_nodes)
                time.sleep(0.5)  # Small delay to avoid overwhelming the server
        
        # Create reports under the last set of nodes
        for node_id in level_nodes[levels]:
            report_id = create_report()
            if report_id:
                attach_report_to_parent(report_id, node_id)
        
        # Create node rules from bottom to top for the last level nodes
        for level in reversed(range(1, levels + 1)):
            for parent_id in level_nodes[level - 1]:
                create_rule_for_nodes(parent_id, level_nodes[level])

if __name__ == "__main__":
    create_hierarchy("Root Node", levels=3, children_per_level=2)
