import { db } from "../utils/firebaseAdmin";
import { embedKnowledgeDocuments } from "../rag/knowledgeService";
import { buildSeedFlights, seedKnowledgeDocs } from "./seedData";

export async function seedDatabase(geminiApiKey?: string) {
  const flights = buildSeedFlights();
  const batchSize = 400;
  let flightCount = 0;

  for (let i = 0; i < flights.length; i += batchSize) {
    const batch = db.batch();
    const chunk = flights.slice(i, i + batchSize);
    for (const flight of chunk) {
      const { id, ...data } = flight;
      batch.set(db.collection("flights").doc(id), data);
      flightCount += 1;
    }
    await batch.commit();
  }

  const knowledgeBatch = db.batch();
  seedKnowledgeDocs.forEach((doc, index) => {
    knowledgeBatch.set(db.collection("knowledge").doc(`kb_${index + 1}`), doc);
  });
  await knowledgeBatch.commit();

  let embeddedCount = 0;
  if (geminiApiKey) {
    embeddedCount = await embedKnowledgeDocuments(geminiApiKey);
  }

  return {
    flights: flightCount,
    knowledge: seedKnowledgeDocs.length,
    embedded: embeddedCount,
  };
}

export async function isDatabaseSeeded(): Promise<boolean> {
  const snapshot = await db.collection("flights").limit(1).get();
  return !snapshot.empty;
}
