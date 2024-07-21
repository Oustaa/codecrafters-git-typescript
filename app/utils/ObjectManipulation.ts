import * as fs from "node:fs";
import zlib from "node:zlib";
import crypto from "node:crypto";

export function getObjectConent(path: string): string {
  const blob = fs.readFileSync(path);

  const decompressedBuffer = zlib.unzipSync(blob);

  const nullByteIndex = decompressedBuffer.indexOf(0);
  const blobContent = decompressedBuffer.subarray(nullByteIndex + 1).toString();

  return blobContent;
}

export function getObjectSha1(
  filePath: string,
  type: string = "blob"
): [string, string] {
  const fileContentBuffer = fs.readFileSync(filePath);
  const fileContent = fileContentBuffer.toString("utf-8");
  const fileSize = fileContent.length;

  const blob = `${type} ${fileSize}\0${fileContent}`;

  const sha1 = crypto.createHash("sha1").update(blob).digest("hex");

  return [sha1, blob];
}

export function storeObject(sha1: string, blob: zlib.InputType) {
  const folderName = sha1.substring(0, 2);
  const fileName = sha1.substring(2);

  const compressedBlob = zlib.deflateSync(blob);

  fs.mkdirSync(`./.git/objects/${folderName}`);
  fs.writeFileSync(`./.git/objects/${folderName}/${fileName}`, compressedBlob);
}

