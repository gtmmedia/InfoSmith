import { NextRequest, NextResponse } from "next/server"
import fs from "node:fs/promises"
import path from "node:path"
import {
  getOriginalUploadName,
  getStoredUploadPath,
  getUploadsDir,
} from "@/lib/uploads"

export const runtime = "nodejs"

export async function GET() {
  try {
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
    })
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
    const { name } = await req.json()

    if (!name || typeof name !== "string" || path.basename(name) !== name) {
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

    await fs.unlink(getStoredUploadPath(name))

    return NextResponse.json({
      success: true,
    })
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