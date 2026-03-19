const fs = require('fs');
const csv = require('csv-parser');
require('dotenv').config({ path: __dirname + '/.env' });
const neo4j = require('neo4j-driver');

const CSV_PATH = '../nlp/gnn/output.csv';
const results = [];

async function seed() {
  const driver = neo4j.driver(process.env.NEO4J_URI, neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD));
  const session = driver.session();
  
  try {
    console.log("1. Clearing database...");
    await session.run('MATCH (n) DETACH DELETE n');

    console.log("2. Inserting Claim nodes...");
    let idCounter = 0;
    const nodes = results.map(row => {
      return { 
        id: `claim_${idCounter++}`, // Match existing format
        ...row
      };
    });

    for(let i=0; i<nodes.length; i+=500) {
      const batch = nodes.slice(i, i+500);
      await session.run(`
        UNWIND $batch AS row
        CREATE (c:Claim)
        SET c = row
      `, { batch });
      console.log(`Inserted nodes ${i} to ${i + batch.length}`);
    }

    console.log("3. Generating SAME_ZIP edges...");
    const resZip = await session.run(`
      MATCH (a:Claim)
      WITH a.insured_zip AS zip, collect(a) AS group
      WHERE size(group) > 1 AND zip <> '?' AND zip <> ''
      UNWIND group AS a
      UNWIND group AS b
      WITH a, b WHERE a.id > b.id
      MERGE (a)-[:SAME_ZIP]-(b)
      RETURN count(*) as n
    `);
    console.log(`Created ${resZip.records[0].get(0)} SAME_ZIP edges`);

    console.log("4. Generating SAME_LOCATION edges...");
    const resLoc = await session.run(`
      MATCH (a:Claim)
      WITH a.incident_location AS loc, collect(a) AS group
      WHERE size(group) > 1 AND loc <> '?' AND loc <> ''
      UNWIND group AS a
      UNWIND group AS b
      WITH a, b WHERE a.id > b.id
      MERGE (a)-[:SAME_LOCATION]-(b)
      RETURN count(*) as n
    `);
    console.log(`Created ${resLoc.records[0].get(0)} SAME_LOCATION edges`);

    console.log("5. Generating SAME_MAKE edges...");
    const resMake = await session.run(`
      MATCH (a:Claim)
      WITH a.auto_make AS make, collect(a) AS group
      WHERE size(group) > 1 AND make <> '?' AND make <> ''
      UNWIND group AS a
      UNWIND group AS b
      WITH a, b WHERE a.id > b.id
      MERGE (a)-[:SAME_MAKE]-(b)
      RETURN count(*) as n
    `);
    console.log(`Created ${resMake.records[0].get(0)} SAME_MAKE edges`);

  } catch(e) {
    console.error("Error during seeding:", e);
  } finally {
    await session.close();
    await driver.close();
    console.log("Seeding complete.");
  }
}

fs.createReadStream(CSV_PATH)
  .pipe(csv())
  .on('data', (data) => results.push(data))
  .on('end', () => {
    console.log(`Successfully parsed ${results.length} rows from CSV`);
    seed();
  });
