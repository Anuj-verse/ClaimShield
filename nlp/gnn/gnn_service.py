"""
gnn_service.py — In-memory GNN fraud ring traversal (Python-side fallback)
Loads the NetworkX pkl once at import time and serves neighbour queries.
"""
import os, pickle

_graph = None

def _load_graph():
    global _graph
    if _graph is None:
        pkl_path = os.path.join(os.path.dirname(__file__), 'gnn_graph.pkl')
        with open(pkl_path, 'rb') as f:
            _graph = pickle.load(f)
        print(f"[GNN] Loaded graph: {_graph.number_of_nodes()} nodes, {_graph.number_of_edges()} edges")
    return _graph

def get_neighbours(claim_id: str, depth: int = 2) -> dict:
    """Return the fraud ring neighbourhood of a claim node."""
    G = _load_graph()

    # Resolve closest matching node (exact or prefix)
    target = claim_id if G.has_node(claim_id) else None
    if target is None:
        # Try prefix match: "CLM-5" -> "claim_5"
        stripped = claim_id.replace('CLM-', '').replace('claim_', '')
        candidate = f'claim_{stripped}'
        target = candidate if G.has_node(candidate) else None

    if target is None:
        return {'nodes': [], 'links': [], 'error': f'Node {claim_id} not found in GNN graph'}

    # BFS up to `depth` hops
    visited = {target}
    frontier = {target}
    for _ in range(depth):
        next_frontier = set()
        for n in frontier:
            for nbr in G.neighbors(n):
                if nbr not in visited:
                    next_frontier.add(nbr)
                    visited.add(nbr)
        frontier = next_frontier
        if len(visited) > 50:  # cap at 50 nodes for UI performance
            break

    nodes = []
    for nid in visited:
        attrs = G.nodes[nid]
        nodes.append({
            'id': nid,
            'name': f'Claim {nid}',
            'riskScore': 85 if attrs.get('fraud_reported') == 'Y' else 30,
            'label': 'PRIMARY' if nid == target else 'CONNECTED',
            'val': 12 if nid == target else 7,
            'autoMake': attrs.get('auto_make', ''),
            'zip': str(attrs.get('insured_zip', '')),
            'location': attrs.get('incident_location', ''),
            'fraudReported': attrs.get('fraud_reported', 'N'),
        })

    # Only edges within the visited subgraph
    visited_list = list(visited)
    links = []
    for u, v in G.edges():
        if u in visited and v in visited:
            u_attrs = G.nodes[u]
            v_attrs = G.nodes[v]
            label = ('Same ZIP' if u_attrs.get('insured_zip') == v_attrs.get('insured_zip')
                     else 'Same Make' if u_attrs.get('auto_make') == v_attrs.get('auto_make')
                     else 'Policy Link')
            links.append({'source': u, 'target': v, 'label': label, 'strength': 0.7})

    fraud_nodes = [n for n in nodes if n['fraudReported'] == 'Y']
    fraud_ring_id = f"FR-{target.replace('claim_', '').zfill(3)}" if fraud_nodes else None

    return {
        'claimId': claim_id,
        'fraudRingId': fraud_ring_id,
        'nodes': nodes,
        'links': links,
        'source': 'gnn_pkl',
        'metadata': {
            'nodeCount': len(nodes),
            'edgeCount': len(links),
            'fraudNodes': len(fraud_nodes),
        }
    }
