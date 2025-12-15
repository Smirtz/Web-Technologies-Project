import "dotenv/config";
import cron from "node-cron";
import { initDb } from "./db.js";
import { buildApp } from "./app.js";
import { assignJuriesForDueDeliverables } from "./jobs/assignJuries.js";

const PORT = Number(process.env.PORT || 3000);

await initDb();

const app = buildApp();

// Run jury assignment every minute (cron syntax). :contentReference[oaicite:7]{index=7}
cron.schedule("* * * * *", async () => {
  try {
    await assignJuriesForDueDeliverables();
  } catch (e) {
    console.error("assignJuries job failed:", e.message);
  }
});

app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));