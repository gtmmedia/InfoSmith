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

export async function GET() {
  try {
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
      })
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
          },
        )
      }

      await del(blob.url)
    } else {
      await fs.unlink(getStoredUploadPath(name))
    }

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
