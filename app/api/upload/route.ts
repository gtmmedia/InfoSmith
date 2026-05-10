import { NextRequest, NextResponse } from "next/server"
import fs from "node:fs/promises"
import { ingestFile } from "@/lib/ingest"
import { getStoredUploadPath, getUploadsDir } from "@/lib/uploads"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  let storedFileName: string | undefined
  try {
    const formData = await req.formData()
    const body = Object.fromEntries(formData)
    const file = (body.file as Blob) || null

    const prefix = Date.now()

    if (file) {
      storedFileName = `${prefix}-${(body.file as File).name.replaceAll("/", "-")}`
      const buffer = Buffer.from(await file.arrayBuffer())
      await fs.mkdir(getUploadsDir(), { recursive: true })

      //await fs.writeFile(getStoredUploadPath(storedFileName), buffer)

      await ingestFile(body.file as File, storedFileName)
    } else {
      return NextResponse.json({
        success: false,
      })
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
