require('dotenv').config({ path: '/storage/claimshield/backend/.env' });
const neo4j = require('neo4j-driver');

async function seed() {
  const driver = neo4j.driver(process.env.NEO4J_URI, neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD));
  const session = driver.session();
  try {
    // 1. Clear old data
    await session.run('MATCH (n:Claim) DETACH DELETE n');
    console.log("Cleared DB.");

    // 2. Insert 10 nodes mimicking gnn output
    const nodes = [
      { id: 'claim_0', policy_number: '521585', insured_zip: '466132', auto_make: 'Saab', fraud_reported: 'Y' },
      { id: 'claim_5', policy_number: '342868', insured_zip: '468176', auto_make: 'Mercedes', fraud_reported: 'Y' },
      { id: 'claim_9', policy_number: '123456', insured_zip: '466132', auto_make: 'BMW', fraud_reported: 'N' },
      { id: 'claim_12', policy_number: '987654', insured_zip: '468176', auto_make: 'Saab', fraud_reported: 'Y' }
    ];

    await session.run(`
      UNWIND $rows AS row
      MERGE (c:Claim {id: row.id})
      SET c.policy_number = row.policy_number,
          c.insured_zip = row.insured_zip,
          c.auto_make = row.auto_make,
          c.fraud_reported = row.fraud_reported
    `, { rows: nodes });
    console.log("Inserted Nodes.");

    // 3. Insert specific edges
    const edges = [
      { src: 'claim_0', dst: 'claim_9', label: 'Same ZIP' },
      { src: 'claim_0', dst: 'claim_12', label: 'Same Make' },
      { src: 'claim_5', dst: 'claim_12', label: 'Same ZIP' }
    ];

    await session.run(`
      UNWIND $rows AS row
      MATCH (a:Claim {id: row.src})
      MATCH (b:Claim {id: row.dst})
      MERGE (a)-[:CONNECTED_TO]->(b)
    `, { rows: edges });
    console.log("Inserted Edges.");

  } catch(e) {
    console.error("Error:", e);
  } finally {
    await session.close();
    await driver.close();
  }
}
seed();
