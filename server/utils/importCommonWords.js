import fs from "fs";
import path from "path";
import prisma from "../prisma.js";

const FILE_PATH = path.join(
  process.cwd(),
  "utils",
  "pod_word_data.csv"
);

function parseCSV() {
  const raw = fs.readFileSync(FILE_PATH, "utf8");

  const lines = raw.split("\n");

  const words = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    const columns = line.split(",");

    // Skip header
    if (columns[0] === "Lemma") continue;

    const word = columns[0]
      ?.trim()
      .toLowerCase();

    if (!word) continue;

    words.push({ word });
  }

  return words;
}

async function main() {
  console.log("Importing NGSL words...");

  const words = parseCSV();

  console.log(`Parsed ${words.length} words`);

  await prisma.commonWord.createMany({
    data: words,
    skipDuplicates: true
  });

  console.log("Import complete");
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});