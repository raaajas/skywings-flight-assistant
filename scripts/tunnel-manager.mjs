import { spawn } from "child_process";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import path from "path";

// Set up credentials
const adcPath = path.resolve("adc.json");
process.env.GOOGLE_APPLICATION_CREDENTIALS = adcPath;
process.env.GCLOUD_PROJECT = "skywings-flight-assistant";

initializeApp();
const db = getFirestore();

let lastUrl = "";

async function updateFirestore(url) {
  if (url === lastUrl) return;
  lastUrl = url;
  try {
    await db.collection("config").doc("api").set({
      url: url,
      updatedAt: new Date().toISOString()
    });
    console.log(`[TunnelManager] Updated Firestore API URL to: ${url}`);
  } catch (err) {
    console.error("[TunnelManager] Failed to update Firestore:", err);
  }
}

function startTunnel() {
  console.log("[TunnelManager] Starting localhost.run tunnel...");
  const ssh = spawn("ssh", [
    "-o", "StrictHostKeyChecking=no",
    "-o", "ServerAliveInterval=30",
    "-o", "ServerAliveCountMax=3",
    "-R", "80:localhost:8888",
    "nokey@localhost.run"
  ]);

  let buffer = "";

  ssh.stdout.on("data", (data) => {
    const text = data.toString();
    process.stdout.write(text);
    buffer += text;
    checkBuffer();
  });

  ssh.stderr.on("data", (data) => {
    const text = data.toString();
    process.stderr.write(text);
    buffer += text;
    checkBuffer();
  });

  ssh.on("close", (code) => {
    console.log(`[TunnelManager] Tunnel connection closed with code ${code}. Restarting in 5s...`);
    setTimeout(startTunnel, 5000);
  });

  function checkBuffer() {
    const lines = buffer.split("\n");
    // Keep only the last unfinished line in buffer
    buffer = lines.pop() || "";

    for (const line of lines) {
      // Look for ".lhr.life" in the line
      const match = line.match(/(https:\/\/[a-zA-Z0-9.-]+\.lhr\.life)/);
      if (match && match[1]) {
        const url = match[1];
        console.log(`[TunnelManager] Detected tunnel URL: ${url}`);
        updateFirestore(url);
      }
    }
  }
}

startTunnel();
