require('dotenv').config({ path: '/storage/claimshield/backend/.env' });
const neo4j = require('neo4j-driver');
const driver = neo4j.driver(process.env.NEO4J_URI, neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD));
const session = driver.session();
session.run('MATCH (n:Claim) RETURN count(n) as nodeCount, collect(n.id)[0..5] as sampleIds')
  .then(res => { console.log(res.records[0].toObject()); return session.run('MATCH ()-[r:CONNECTED_TO]->() RETURN count(r) as edgeCount'); })
  .then(res => { console.log("Edges:", res.records[0].get(0).toNumber()); driver.close(); })
  .catch(err => { console.error(err); driver.close(); });
