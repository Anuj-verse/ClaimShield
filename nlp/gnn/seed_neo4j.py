#!/usr/bin/env python3
"""
seed_neo4j.py — Push GNN fraud graph into Neo4j AuraDB
Usage: python3 seed_neo4j.py
Requires: NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD env vars
"""
import os, pickle, time
from dotenv import load_dotenv
from neo4j import GraphDatabase

# Load env from nlp/.env or parent backend/.env
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', 'backend', '.env'))

NEO4J_URI  = os.getenv('NEO4J_URI')
NEO4J_USER = os.getenv('NEO4J_USER', 'neo4j')
NEO4J_PASS = os.getenv('NEO4J_PASSWORD')

if not NEO4J_URI or not NEO4J_PASS:
    raise SystemExit("❌  Set NEO4J_URI and NEO4J_PASSWORD in backend/.env before running.")

print(f"Connecting to {NEO4J_URI} ...")
driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASS))
driver.verify_connectivity()
print("✅  Connected to Neo4j")

# Load GNN graph
graph_path = os.path.join(os.path.dirname(__file__), 'gnn_graph.pkl')
with open(graph_path, 'rb') as f:
    G = pickle.load(f)

print(f"Graph: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")

BATCH = 250  # nodes per transaction batch

def seed_nodes(session, nodes):
    cypher = """
    UNWIND $rows AS row
    MERGE (c:Claim {id: row.id})
    SET c.policy_number    = row.policy_number,
        c.insured_zip      = row.insured_zip,
        c.auto_make        = row.auto_make,
        c.incident_location= row.incident_location,
        c.fraud_reported   = row.fraud_reported
    """
    session.run(cypher, rows=nodes)

def seed_edges(session, edges):
    cypher = """
    UNWIND $rows AS row
    MATCH (a:Claim {id: row.src})
    MATCH (b:Claim {id: row.dst})
    MERGE (a)-[:CONNECTED_TO]->(b)
    """
    session.run(cypher, rows=edges)

with driver.session() as session:
    # Clear old data
    session.run("MATCH (c:Claim) DETACH DELETE c")
    print("🗑  Cleared existing Claim nodes")

    # Seed nodes in batches
    all_nodes = []
    for node_id, attrs in G.nodes(data=True):
        all_nodes.append({
            'id': str(node_id),
            'policy_number': str(attrs.get('policy_number', '')),
            'insured_zip': str(attrs.get('insured_zip', '')),
            'auto_make': str(attrs.get('auto_make', '')),
            'incident_location': str(attrs.get('incident_location', '')),
            'fraud_reported': str(attrs.get('fraud_reported', 'N')),
        })
    # Limit to 10 nodes
    all_nodes = all_nodes[:10]

    for i in range(0, len(all_nodes), BATCH):
        batch = all_nodes[i:i + BATCH]
        seed_nodes(session, batch)
        print(f"  nodes {i+1}–{min(i+BATCH, len(all_nodes))} ✓", end='\r')
    print(f"\n✅  Seeded {len(all_nodes)} nodes")

    # Seed edges in batches
    # Limit edges to only those where both nodes are in our 10-node slice
    node_ids = {n['id'] for n in all_nodes}
    all_edges = [{'src': str(u), 'dst': str(v)} for u, v in G.edges() if str(u) in node_ids and str(v) in node_ids]
    
    for i in range(0, len(all_edges), BATCH):
        batch = all_edges[i:i + BATCH]
        seed_edges(session, batch)
        print(f"  edges {i+1}–{min(i+BATCH, len(all_edges))} ✓", end='\r')
    print(f"\n✅  Seeded {len(all_edges)} edges")

# Create index for fast lookup
with driver.session() as session:
    session.run("CREATE INDEX claim_id IF NOT EXISTS FOR (c:Claim) ON (c.id)")
    print("✅  Index created on Claim.id")

driver.close()
print("\n🎉  Neo4j seeding complete!")
