import { GoogleGenAI } from "@google/genai";
import { db } from "../utils/firebaseAdmin";
import type { KnowledgeDoc } from "../types";

const KNOWLEDGE = "knowledge";

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) {
    return 0;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function embedText(text: string, apiKey: string): Promise<number[]> {
  const ai = new GoogleGenAI({ apiKey });
  const result = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: text,
  });
  const values = result.embeddings?.[0]?.values;
  if (!values?.length) {
    throw new Error("Embedding response was empty");
  }
  return values;
}

export async function searchKnowledgeBase(
  query: string,
  apiKey: string,
  limit = 5,
): Promise<KnowledgeDoc[]> {
  const snapshot = await db.collection(KNOWLEDGE).get();
  const docs = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<KnowledgeDoc, "id">),
  }));

  const normalizedQuery = query.toLowerCase();
  const keywordMatches = docs.filter((doc) => {
    const haystack = `${doc.title} ${doc.content} ${doc.keywords.join(" ")}`.toLowerCase();
    return doc.keywords.some((kw) => normalizedQuery.includes(kw.toLowerCase()))
      || normalizedQuery.split(/\s+/).some((word) => word.length > 3 && haystack.includes(word));
  });

  if (keywordMatches.length >= limit) {
    return keywordMatches.slice(0, limit);
  }

  try {
    const queryEmbedding = await embedText(query, apiKey);
    const scored = docs
      .filter((doc) => doc.embedding?.length)
      .map((doc) => ({
        doc,
        score: cosineSimilarity(queryEmbedding, doc.embedding!),
      }))
      .sort((a, b) => b.score - a.score);

    const merged = new Map<string, KnowledgeDoc>();
    for (const doc of keywordMatches) {
      merged.set(doc.id, doc);
    }
    for (const { doc } of scored) {
      merged.set(doc.id, doc);
      if (merged.size >= limit) {
        break;
      }
    }
    return Array.from(merged.values()).slice(0, limit);
  } catch {
    return keywordMatches.slice(0, limit);
  }
}

export async function embedKnowledgeDocuments(apiKey: string): Promise<number> {
  const snapshot = await db.collection(KNOWLEDGE).get();
  let updated = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data() as Omit<KnowledgeDoc, "id">;
    if (data.embedding?.length) {
      continue;
    }
    try {
      const embedding = await embedText(`${data.title}\n${data.content}`, apiKey);
      await doc.ref.update({ embedding });
      updated += 1;
    } catch {
      // Embeddings are optional; keyword search still works.
    }
  }

  return updated;
}
