import os from "node:os"
import path from "node:path"

export const getUploadsDir = () => {
  if (process.env.UPLOAD_DIR) {
    return path.resolve(process.env.UPLOAD_DIR)
  }

  if (process.env.NODE_ENV === "production") {
    return path.join(os.tmpdir(), "uploads")
  }

  return path.resolve(process.cwd(), "public/uploads")
}

export const getStoredUploadPath = (fileName: string) =>
  path.join(getUploadsDir(), path.basename(fileName))

export const getOriginalUploadName = (storedName: string) => {
  const match = storedName.match(/^\d+-(.+)$/)
  return match?.[1] ?? storedName
}
