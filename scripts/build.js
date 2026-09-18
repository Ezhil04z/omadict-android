import { cp, mkdir, rm } from "node:fs/promises";

const src = new URL("../web", import.meta.url).pathname;
const dest = new URL("../www", import.meta.url).pathname;

await rm(dest, { recursive: true, force: true });
await mkdir(dest, { recursive: true });
await cp(src, dest, { recursive: true });
console.log("Built www/ from web/");