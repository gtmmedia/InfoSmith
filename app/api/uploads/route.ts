import { NextRequest, NextResponse } from "next/server"
import fs from "node:fs/promises"
import path from "node:path"
import {
  getOriginalUploadName,
  getStoredUploadPath,
  getUploadsDir,
} from "@/lib/uploads"

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

export async function GET(req: NextRequest) {
  try {
    const headers = getCorsHeaders(req.headers.get("origin"))
    if (useBlobStore) {
      const { list } = await import("@vercel/blob")
      const { blobs } = await list()

      const files = blobs.map((blob) => {
        const uploadedAt =
          blob.uploadedAt instanceof Date
            ? blob.uploadedAt
            : new Date(blob.uploadedAt)

        return {
          name: blob.pathname,
          originalName: getOriginalUploadName(blob.pathname),
          size: blob.size,
          url: `/api/uploads/${encodeURIComponent(blob.pathname)}`,
          uploadedAt: uploadedAt.toISOString(),
        }
      })

      files.sort(
        (a, b) =>
          new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
      )

      return NextResponse.json({
        success: true,
        files,
      }, { headers })
    }

    const uploadDir = getUploadsDir()
    await fs.mkdir(uploadDir, { recursive: true })

    const entries = await fs.readdir(uploadDir, { withFileTypes: true })
    const files = await Promise.all(
      entries
        .filter((entry) => entry.isFile())
        .map(async (entry) => {
          const filePath = path.join(uploadDir, entry.name)
          const stats = await fs.stat(filePath)

          return {
            name: entry.name,
            originalName: getOriginalUploadName(entry.name),
            size: stats.size,
            url: `/api/uploads/${encodeURIComponent(entry.name)}`,
            uploadedAt: stats.mtime.toISOString(),
          }
        }),
    )

    files.sort(
      (a, b) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
    )

    return NextResponse.json({
      success: true,
      files,
    }, { headers })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      {
        success: false,
        files: [],
      },
      {
        status: 500,
      },
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const headers = getCorsHeaders(req.headers.get("origin"))
    const { name } = await req.json()

    if (!name || typeof name !== "string" || path.basename(name) !== name) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid file name",
        },
        {
          status: 400,
          headers,
        },
      )
    }

    if (useBlobStore) {
      const { del, list } = await import("@vercel/blob")
      const { blobs } = await list({ prefix: name, limit: 1 })
      const blob = blobs.find((item) => item.pathname === name)

      if (!blob) {
        return NextResponse.json(
          {
            success: false,
            message: "File not found",
          },
          {
            status: 404,
            headers,
          },
        )
      }

      await del(blob.url)
    } else {
      await fs.unlink(getStoredUploadPath(name))
    }

    return NextResponse.json({
      success: true,
    }, { headers })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      {
        success: false,
      },
      {
        status: 500,
      },
    )
  }
}
