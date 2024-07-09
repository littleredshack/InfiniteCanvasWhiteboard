from neo4j import GraphDatabase
import json
from datetime import datetime
from neo4j.time import DateTime

# Connect to the Neo4j database
uri = "bolt://localhost:7687"
driver = GraphDatabase.driver(uri, auth=("neo4j", "password"))

def fetch_data(tx):
    nodes_query = """
    MATCH (n)
    RETURN id(n) AS id, properties(n) AS props
    """
    
    relationships_query = """
    MATCH (n)-[r:CONTAINS]->(m)
    RETURN id(n) AS parent_id, id(m) AS child_id
    """
    
    edges_query = """
    MATCH (n)-[r]->(m)
    WHERE NOT type(r) = 'CONTAINS'
    RETURN id(n) AS fromId, id(m) AS toId, type(r) AS type, properties(r) AS props
    """

    nodes_result = tx.run(nodes_query)
    relationships_result = tx.run(relationships_query)
    edges_result = tx.run(edges_query)
    
    nodes = {}
    for record in nodes_result:
        node_props = record["props"]
        node_props["id"] = record["id"]
        node_props["children"] = []
        nodes[record["id"]] = node_props
        
    relationships = {}
    for record in relationships_result:
        parent_id = record["parent_id"]
        child_id = record["child_id"]
        if parent_id not in relationships:
            relationships[parent_id] = []
        relationships[parent_id].append(child_id)
        
    edges = []
    for record in edges_result:
        edge_props = record["props"]
        edge_props.update({
            "fromId": record["fromId"],
            "toId": record["toId"],
            "type": record["type"],
            "displayFromId": record["fromId"],
            "displayToId": record["toId"]
        })
        edges.append(edge_props)
        
    return nodes, relationships, edges

def build_nested_structure(nodes, relationships, parent_id=None):
    children = []
    for child_id in relationships.get(parent_id, []):
        child_node = nodes[child_id]
        child_node["children"] = build_nested_structure(nodes, relationships, child_id)
        children.append(child_node)
    return children

def find_root_nodes(nodes, relationships):
    child_ids = {child_id for child_ids in relationships.values() for child_id in child_ids}
    root_nodes = [node for node_id, node in nodes.items() if node_id not in child_ids]
    return root_nodes

class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (datetime, DateTime)):
            return obj.isoformat()
        return str(obj)

def debug_structure(structure, level=0):
    indent = ' ' * (level * 2)
    for node in structure:
        print(f"{indent}- id: {node['id']}, name: {node.get('name')}, children count: {len(node['children'])}")
        debug_structure(node['children'], level + 1)

with driver.session() as session:
    nodes, relationships, edges = session.execute_read(fetch_data)
    
    # Debug output for nodes and relationships
    print("Nodes:")
    for node_id, node in nodes.items():
        print(f"  {node_id}: {node}")
    print("Relationships:")
    for parent_id, child_ids in relationships.items():
        print(f"  {parent_id} -> {child_ids}")
    
    # Find root nodes
    root_nodes = find_root_nodes(nodes, relationships)
    for root in root_nodes:
        root["children"] = build_nested_structure(nodes, relationships, root["id"])
    
    # Debug output for the nested structure
    print("Nested Structure:")
    debug_structure(root_nodes)
    
    # Create the final JSON structure
    final_structure = {
        "nodes": root_nodes,
        "edges": edges
    }
    
    # Write to a JSON file
    with open("output.json", "w") as outfile:
        json.dump(final_structure, outfile, indent=4, cls=CustomJSONEncoder)

print("Data has been written to output.json")
