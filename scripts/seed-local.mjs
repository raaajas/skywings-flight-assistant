const projectId = process.env.FIREBASE_PROJECT_ID ?? "skywings-flight-assistant";
const seedSecret = process.env.SEED_SECRET ?? "dev-seed-secret";
const url = `http://127.0.0.1:5001/${projectId}/us-central1/api/seed`;

async function waitForApi(maxAttempts = 30) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const health = await fetch(
        `http://127.0.0.1:5001/${projectId}/us-central1/api/health`,
      );
      if (health.ok) {
        return;
      }
    } catch {
      // emulator still starting
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error("Functions emulator did not become ready in time");
}

async function main() {
  await waitForApi();
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "x-seed-secret": seedSecret,
    },
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.error ?? `Seed failed (${response.status})`);
  }

  console.log(JSON.stringify(body, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
