import * as fs from "node:fs";
import zlib from "node:zlib";

const args = process.argv.slice(2);
const command = args[0];

enum Commands {
  Init = "init",
  Catfile = "cat-file",
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
    const blob = fs.readFileSync(`./.git/objects/${blobDir}/${blobFile}`);
    const decompressedBuffer = zlib.unzipSync(blob);

    const nullByteIndex = decompressedBuffer.indexOf(0);
    const blobContent = decompressedBuffer
      .subarray(nullByteIndex + 1)
      .toString();

    process.stdout.write(blobContent);
    break;

  default:
    throw new Error(`Unknown command ${command}`);
}

