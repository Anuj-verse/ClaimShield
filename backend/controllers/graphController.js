const { generateFraudRingGraph } = require('../utils/mlMock');

const getGraph = async (req, res) => {
  const { claimId } = req.params;
  // In production this would query Neo4j or a graph DB
  // For demo, generate deterministic graph from claimId
  const graph = generateFraudRingGraph(claimId, `FR-${(claimId.length % 20) + 1}`);
  res.json(graph);
};

module.exports = { getGraph };
