const { runQuery } = require('../utils/neo4j');
const { generateFraudRingGraph } = require('../utils/mlMock');

/**
 * Query Neo4j for the 2-hop fraud ring neighbourhood of a claim.
 * Falls back to deterministic mock if Neo4j is unreachable.
 */
const getGraph = async (req, res) => {
  const { claimId } = req.params;

  // Try Neo4j first
  const records = await runQuery(
    `MATCH (root:Claim {id: $id})-[r]-(neighbour:Claim)
     RETURN DISTINCT root, neighbour, type(r) AS relType
     LIMIT 50`,
    { id: claimId }
  );

  if (records && records.length > 0) {
    const nodeMap = new Map();
    const links = [];

    records.forEach(rec => {
      const root = rec.get('root').properties;
      const nbr  = rec.get('neighbour').properties;

      if (!nodeMap.has(root.id)) {
        nodeMap.set(root.id, {
          id: root.id,
          name: `Claim ${root.id}`,
          riskScore: root.fraud_reported === 'Y' ? 85 : 35,
          label: 'PRIMARY',
          val: 12,
          autoMake: root.auto_make,
          zip: root.insured_zip,
          fraudReported: root.fraud_reported
        });
      }

      if (!nodeMap.has(nbr.id)) {
        nodeMap.set(nbr.id, {
          id: nbr.id,
          name: `Claim ${nbr.id}`,
          riskScore: nbr.fraud_reported === 'Y' ? 75 : 25,
          label: 'CONNECTED',
          val: 7,
          autoMake: nbr.auto_make,
          zip: nbr.insured_zip,
          fraudReported: nbr.fraud_reported
        });
      }

      links.push({
        source: root.id,
        target: nbr.id,
        label: rec.get('relType').replace('SAME_', 'Same ').replace('_', ' '),
        strength: 0.7
      });
    });

    const nodes = Array.from(nodeMap.values());
    const fraudRingId = nodes.some(n => n.fraudReported === 'Y')
      ? `FR-${claimId.replace(/\D/g, '').slice(-3).padStart(3, '0')}`
      : null;

    return res.json({
      fraudRingId,
      nodes,
      links,
      source: 'neo4j',
      metadata: {
        nodeCount: nodes.length,
        edgeCount: links.length,
        claimId
      }
    });
  }

  // Fallback: deterministic mock
  console.log(`[Graph] Neo4j unavailable for ${claimId}, using mock`);
  const graph = generateFraudRingGraph(claimId, `FR-${(claimId.length % 20) + 1}`);
  return res.json({ ...graph, source: 'mock' });
};

module.exports = { getGraph };
