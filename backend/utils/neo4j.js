const neo4j = require('neo4j-driver');

let _driver = null;

function getDriver() {
  if (_driver) return _driver;

  const { NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD } = process.env;
  if (!NEO4J_URI || !NEO4J_PASSWORD) {
    console.warn('[Neo4j] NEO4J_URI / NEO4J_PASSWORD not set — graph queries will use mock fallback.');
    return null;
  }

  try {
    _driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER || 'neo4j', NEO4J_PASSWORD));
    console.log('[Neo4j] Driver initialised →', NEO4J_URI);
  } catch (err) {
    console.error('[Neo4j] Driver init failed:', err.message);
    return null;
  }
  return _driver;
}

/**
 * Run a Cypher query and return all records as plain JS objects.
 * Returns null if Neo4j is not configured or an error occurs.
 */
async function runQuery(cypher, params = {}) {
  const driver = getDriver();
  if (!driver) return null;

  const session = driver.session();
  try {
    const result = await session.run(cypher, params);
    return result.records;
  } catch (err) {
    console.error('[Neo4j] Query error:', err.message);
    return null;
  } finally {
    await session.close();
  }
}

module.exports = { runQuery, getDriver };
