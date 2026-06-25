import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import path from "path";

const url = process.argv[2];
if (!url) {
  console.error("Please provide a tunnel URL");
  process.exit(1);
}

// Set up credentials using adc.json
const adcPath = path.resolve("adc.json");
process.env.GOOGLE_APPLICATION_CREDENTIALS = adcPath;
process.env.GCLOUD_PROJECT = "skywings-flight-assistant";

// Initialize Firebase Admin
initializeApp();

const db = getFirestore();

async function run() {
  await db.collection("config").doc("api").set({
    url: url,
    updatedAt: new Date().toISOString()
  });
  console.log(`Successfully updated API base URL in Firestore to: ${url}`);
}

run().catch(console.error);
