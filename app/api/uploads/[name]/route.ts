import fs from "node:fs/promises"
import path from "node:path"
import { NextRequest, NextResponse } from "next/server"
import { getStoredUploadPath } from "@/lib/uploads"

export const runtime = "nodejs"

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

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { name } = await params

  if (!name || path.basename(name) !== name) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid file name",
      },
      {
        status: 400,
      },
    )
  }

  try {
    const file = await fs.readFile(getStoredUploadPath(name))
    const contentType =
      contentTypes[path.extname(name).toLowerCase()] ?? "application/octet-stream"

    return new Response(file, {
      headers: {
        "Content-Type": contentType,
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
      },
    )
  }
}