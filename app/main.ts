import * as fs from "node:fs";
import crypto from "node:crypto";
import { getObjectConent, getObjectSha1, storeObject } from "./utils";

const args = process.argv.slice(2);
const command = args[0];

enum Commands {
  Init = "init",
  Catfile = "cat-file",
  HashObject = "hash-object",
}

switch (command) {
  case Commands.Init:
    console.log("Initialized git directory");
    fs.mkdirSync(".git", { recursive: true });
    fs.mkdirSync(".git/objects", { recursive: true });
    fs.mkdirSync(".git/refs", { recursive: true });
    fs.writeFileSync(".git/HEAD", "ref: refs/heads/main\n");
    break;

  case Commands.Catfile:
    if (args.length !== 3) {
      console.error("Usage: git cat-file <object-type> <object-id>");
      process.exit(1);
    }
    const blobDir = args[2].substring(0, 2);
    const blobFile = args[2].substring(2);
    const path = `./.git/objects/${blobDir}/${blobFile}`;

    const blobContent = getObjectConent(path);

    process.stdout.write(blobContent);

    break;

  case Commands.HashObject:
    const storeObjectFlag = args[1] === "-w";
    const filePath = storeObjectFlag ? args[2] : args[1];

    const [sha1, blob] = getObjectSha1(filePath);

    if (storeObjectFlag) {
      storeObject(sha1, blob);
    }

    process.stdout.write(sha1);

    break;

  default:
    throw new Error(`Unknown command ${command}`);
}

