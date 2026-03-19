require('dotenv').config({ path: '/storage/claimshield/backend/.env' });
const neo4j = require('neo4j-driver');

async function check() {
  const driver = neo4j.driver(process.env.NEO4J_URI, neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD));
  const session = driver.session();
  try {
    const res = await session.run('MATCH (n:Claim) RETURN n.id LIMIT 10');
    console.log("Nodes seeded:", res.records.map(r => r.get(0)));

    const res2 = await session.run('MATCH (n:Claim)-[r:CONNECTED_TO]->(m:Claim) RETURN n.id as src, m.id as dst LIMIT 5');
    console.log("Edges found:");
    res2.records.forEach(r => console.log(r.get('src'), '->', r.get('dst')));
  } catch(e) {
    console.error(e);
  } finally {
    await session.close();
    await driver.close();
  }
}
check();
