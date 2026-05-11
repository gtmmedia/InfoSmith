import fs from "node:fs/promises"
import path from "node:path"
import { NextRequest, NextResponse } from "next/server"
import { getStoredUploadPath } from "@/lib/uploads"

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

const getCorsHeaders = (origin: string | null) => {
  if (!origin || !isAllowedOrigin(origin)) return {}
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  }
}

export async function OPTIONS(req: NextRequest) {
  const headers = getCorsHeaders(req.headers.get("origin"))
  return new NextResponse(null, { status: 204, headers })
}

const contentTypes: Record<string, string> = {
  ".csv": "text/csv",
  ".html": "text/html",
  ".json": "application/json",
  ".md": "text/markdown",
  ".pdf": "application/pdf",
  ".txt": "text/plain",
  ".xml": "application/xml",
}

type RouteParams = {
  params: Promise<{
    name: string
  }>
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { name } = await params
  const headers = getCorsHeaders(req.headers.get("origin"))

  if (!name || path.basename(name) !== name) {
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

  try {
    if (useBlobStore) {
      const { list } = await import("@vercel/blob")
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

      return NextResponse.redirect(blob.url, { headers })
    }

    const file = await fs.readFile(getStoredUploadPath(name))
    const contentType =
      contentTypes[path.extname(name).toLowerCase()] ?? "application/octet-stream"

    return new Response(file, {
      headers: {
        "Content-Type": contentType,
        ...headers,
      },
    })
  } catch (error) {
    console.error(error)
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
}
