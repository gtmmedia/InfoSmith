import { NextRequest, NextResponse } from "next/server"
import fs from "node:fs/promises"
import { ingestFile } from "@/lib/ingest"
import { getStoredUploadPath, getUploadsDir } from "@/lib/uploads"

export const runtime = "nodejs"
const useBlobStore =
  process.env.NODE_ENV === "production" && Boolean(process.env.BLOB_READ_WRITE_TOKEN)

export async function POST(req: NextRequest) {
  let storedFileName: string | undefined
  try {
    const formData = await req.formData()
    const file = formData.get("file")

    const prefix = Date.now()

    if (file instanceof File) {
      storedFileName = `${prefix}-${file.name.replaceAll("/", "-")}`
      const buffer = Buffer.from(await file.arrayBuffer())
      await fs.mkdir(getUploadsDir(), { recursive: true })

      await fs.writeFile(getStoredUploadPath(storedFileName), buffer)

      await ingestFile(file, storedFileName)

      if (useBlobStore) {
        const { put } = await import("@vercel/blob")
        await put(storedFileName, buffer, {
          access: "public",
          contentType: file.type || "application/octet-stream",
        })

        await fs.rm(getStoredUploadPath(storedFileName), { force: true })
      }
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "File is required",
        },
        {
          status: 400,
        },
      )
    }

    return NextResponse.json({
      success: true,
      name: storedFileName,
    })
  } catch (error) {
    console.error(error)
    if (storedFileName) {
      await fs.rm(getStoredUploadPath(storedFileName), { force: true })
    }
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Upload failed",
      },
      {
        status: 500,
      }
    )
  }
}
