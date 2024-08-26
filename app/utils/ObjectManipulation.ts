import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import crypto from "node:crypto";

type generateObjectSha1Args = {
  filePath: string;
  type?: string;
  store?: boolean;
};

export function getObjectConent(sha1: string): string {
  const blobDir = sha1.substring(0, 2);
  const blobFile = sha1.substring(2);
  const path = `./.git/objects/${blobDir}/${blobFile}`;

  const blob = fs.readFileSync(path);

  const decompressedBuffer = zlib.unzipSync(blob);

  const nullByteIndex = decompressedBuffer.indexOf(0);
  const blobContent = decompressedBuffer.subarray(nullByteIndex + 1).toString();

  return blobContent;
}

export function generateObjectSha1({
  filePath,
  type = "blob",
  store,
}: generateObjectSha1Args): string {
  const fileContentBuffer = fs.readFileSync(filePath);
  const fileContent = fileContentBuffer.toString("utf-8");
  const fileSize = fileContent.length;

  const blob = `${type} ${fileSize}\0${fileContent}`;

  const sha1 = crypto.createHash("sha1").update(blob).digest("hex");

  if (store) {
    storeObject(sha1, blob);
  }

  return sha1;
}

export function storeObject(sha1: string, blob: zlib.InputType) {
  const folderName = sha1.substring(0, 2);
  const fileName = sha1.substring(2);

  const compressedBlob = zlib.deflateSync(blob);

  if (!fs.existsSync(`./.git/objects/${folderName}`)) {
    fs.mkdirSync(`./.git/objects/${folderName}`);
  }
  fs.writeFileSync(`./.git/objects/${folderName}/${fileName}`, compressedBlob);
}

// export function writeTree(relativePath: string) {
//   const dirStats = fs.statSync(relativePath);

//   const files = fs.readdirSync(relativePath).sort();
//   files.splice(files.indexOf(".git"), 1);

//   const content = Buffer.concat(
//     files.map((file) => {
//       const filePath = path.join(relativePath, file);
//       const isDirectory = fs.statSync(filePath).isDirectory();

//       const hash = isDirectory
//         ? writeTree(filePath)
//         : generateObjectSha1({ filePath });

//       return Buffer.concat([
//         Buffer.from(`${isDirectory ? "40000" : "100644"} ${file}\0`),
//         Buffer.from(hash),
//       ]);
//     })
//   );

//   return content;
// }

const writeTree = (path: string) => {
  const stats = fs.statSync(path);
  if (stats.isDirectory()) {
    const filesInDir = fs
      .readdirSync(path)
      .filter((e) => e !== ".git")
      .sort();
    const content = Buffer.concat(
      filesInDir.map((e) => {
        const filePath = path.join(path, e);
        const isDirectory = fs.statSync(filePath).isDirectory();
        const hash = isDirectory
          ? writeTree(filePath)
          : generateObjectSha1({ filePath });
        return Buffer.concat([
          Buffer.from(`${isDirectory ? "40000" : "100644"} ${e}\0`),
          hash,
        ]);
      })
    );
    const tree = Buffer.concat([
      Buffer.from(`tree ${content.length}\0`),
      content,
    ]);
    const sha = crypto.createHash("sha1").update(tree).digest();
    const shaHex = sha.toString("hex");
    const blobPath = `./.git/objects/${shaHex.slice(0, 2)}/${shaHex.slice(2)}`;
    fs.mkdirSync(path.dirname(blobPath), { recursive: true });
    fs.writeFileSync(blobPath, zlib.deflateSync(tree));
    return sha;
  } else {
    return generateObjectSha1({ filePath: path });
  }
};

