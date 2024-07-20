import * as fs from "node:fs";
import zlib from "node:zlib";
import crypto from "node:crypto";

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
    const blob = fs.readFileSync(`./.git/objects/${blobDir}/${blobFile}`);
    const decompressedBuffer = zlib.unzipSync(blob);

    const nullByteIndex = decompressedBuffer.indexOf(0);
    const blobContent = decompressedBuffer
      .subarray(nullByteIndex + 1)
      .toString();

    process.stdout.write(blobContent);

    break;

  case Commands.HashObject:
    const storeObjectFlag = args[1] === "-w";
    const filePath = storeObjectFlag ? args[2] : args[1];

    const fileContentBuffer = fs.readFileSync(filePath);
    const fileContent = fileContentBuffer.toString("utf-8");
    const fileSize = fileContent.length;

    const blobPrep = `blob ${fileSize}\0${fileContent}`;

    const sha1 = crypto.createHash("sha1").update(blobPrep).digest("hex");

    if (storeObjectFlag) {
      const folderName = sha1.substring(0, 2);
      const fileName = sha1.substring(2);

      const compressedBlob = zlib.deflateSync(Buffer.from(blobPrep));

      fs.mkdirSync(`./.git/objects/${folderName}`);
      fs.writeFileSync(
        `./.git/objects/${folderName}/${fileName}`,
        compressedBlob
      );
    }

    process.stdout.write(sha1);

    break;

  default:
    throw new Error(`Unknown command ${command}`);
}

