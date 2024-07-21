import * as fs from "node:fs";
import zlib from "node:zlib";
import { getObjectConent, getObjectSha1, storeObject } from "./utils";

const args = process.argv.slice(2);
const command = args[0];

enum Commands {
  Init = "init",
  Catfile = "cat-file",
  HashObject = "hash-object",
  LsTree = "ls-tree",
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

    const object = getObjectConent(args[2]);

    process.stdout.write(object);
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

  case Commands.LsTree:
    let sha1ArgsPosition = 1;
    const nameOnly = args.indexOf("--name-only") !== -1;
    if (nameOnly) {
      sha1ArgsPosition++;
    }
    let objectSha1 = args[sha1ArgsPosition];
    const treeContent = getObjectConent(objectSha1);

    if (treeContent.indexOf("tree") === 0) {
      objectSha1 = treeContent.substring(5, treeContent.indexOf("\n"));
    }

    const treeContentObject = getObjectConent(objectSha1);
    const dec = new TextDecoder();
    const str = dec.decode(Buffer.from(treeContentObject));

    // console.log(
    //   treeContentObject.split("\0").slice(1, -1)
    //   // .reduce(
    //   //   (acc: string[], e) => [...acc, e.split(" ").at(-1) as string],
    //   //   []
    //   // )
    // );

    const content = treeContentObject;
    const contentToArray = content.split("\0");
    contentToArray.splice(-1, 1);

    console.log(
      contentToArray
        .reduce(
          (acc: string[], e) => [...acc, e.split(" ").at(-1) as string],
          []
        )
        .join("\n")
    );
    // process.stdout.write(content);
    break;

  default:
    throw new Error(`Unknown command ${command}`);
}

