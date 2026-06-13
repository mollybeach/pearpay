import { setEnvVar } from "./load-env.mjs";

const [key, value] = process.argv.slice(2);
if (!key || !value) {
  console.error("Usage: node scripts/update-env.mjs KEY VALUE");
  process.exit(1);
}
setEnvVar(key, value);
console.log(`Set ${key} in .env`);
