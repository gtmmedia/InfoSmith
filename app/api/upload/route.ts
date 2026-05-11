import { NextRequest, NextResponse } from "next/server"
import fs from "node:fs/promises"
import { ingestFile } from "@/lib/ingest"
import { getStoredUploadPath, getUploadsDir } from "@/lib/uploads"

export const runtime = "nodejs"
const useBlobStore =
  process.env.NODE_ENV === "production" && Boolean(process.env.BLOB_READ_WRITE_TOKEN)
const allowedOrigins = new Set(
  [process.env.NEXT_PUBLIC_API_URL, process.env.ALLOWED_ORIGINS]
    .flatMap((value) => (value ? value.split(",") : []))
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => value.replace(/\/$/, "")),
)

const isAllowedOrigin = (origin: string) => {
  if (allowedOrigins.size === 0) return true
  if (allowedOrigins.has(origin)) return true
  if (origin.endsWith(".vercel.app")) return true
  return false
}

const getCorsHeaders = (origin: string | null): Record<string, string> => {
  const headers: Record<string, string> = {}
  if (!origin || !isAllowedOrigin(origin)) return headers

  headers["Access-Control-Allow-Origin"] = origin
  headers["Access-Control-Allow-Methods"] = "GET,POST,DELETE,OPTIONS"
  headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
  headers["Access-Control-Max-Age"] = "86400"
  headers["Vary"] = "Origin"

  return headers
}

export async function OPTIONS(req: NextRequest) {
  const headers = getCorsHeaders(req.headers.get("origin"))
  return new NextResponse(null, { status: 204, headers })
}

export async function POST(req: NextRequest) {
  let storedFileName: string | undefined
  const headers = getCorsHeaders(req.headers.get("origin"))
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
          headers,
        },
      )
    }

    return NextResponse.json({
      success: true,
      name: storedFileName,
    }, { headers })
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
        headers,
      }
    )
  }
}
