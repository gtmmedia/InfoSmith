"use client";

import { Trash2, X, Check, Loader2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import axios from "axios"


import { Button } from "@/components/ui/button";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemMetadata,
  FileUploadItemPreview,
  FileUploadItemProgress,
  FileUploadList,
  FileUploadTrigger,
} from "@/components/ui/file-upload";
import { File02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export const title = "Basic Dropzone";

type UploadedFile = {
  name: string;
  originalName: string;
  size: number;
  url: string;
  uploadedAt: string;
}

type FileStatus = "uploading" | "embedding" | "done" | "error";

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(i ? 1 : 0)} ${sizes[i]}`;
}

const EmbeddingIndicator = () => (
  <div className="flex items-center gap-2 mt-1">
    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-primary/10">
      <div
        className="absolute inset-y-0 left-0 w-full rounded-full"
        style={{
          background: "linear-gradient(90deg, transparent, var(--primary), transparent)",
          animation: "shimmer 1.5s ease-in-out infinite",
        }}
      />
    </div>
    <span className="flex shrink-0 items-center gap-1 text-xs text-primary animate-pulse">
      <Loader2 className="size-3 animate-spin" />
      Embedding
    </span>
  </div>
);

const Example = () => {
  const [files, setFiles] = React.useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = React.useState<UploadedFile[]>([]);
  const [fileStatuses, setFileStatuses] = React.useState<Map<string, FileStatus>>(new Map());

  const setStatus = React.useCallback((fileName: string, status: FileStatus) => {
    setFileStatuses((prev) => {
      const next = new Map(prev);
      next.set(fileName, status);
      return next;
    });
  }, []);

  const clearStatus = React.useCallback((fileName: string) => {
    setFileStatuses((prev) => {
      const next = new Map(prev);
      next.delete(fileName);
      return next;
    });
  }, []);

  React.useEffect(() => {
    const loadUploadedFiles = async () => {
      try {
        const { data } = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/uploads`);

        if (data.success) {
          setUploadedFiles(data.files);
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load uploaded files");
      }
    }

    loadUploadedFiles();
  }, []);

  const onFileReject = React.useCallback((file: File, message: string) => {
    toast(message, {
      description: `"${file.name.length > 20 ? `${file.name.slice(0, 20)}...` : file.name}" has been rejected`,
    });
  }, []);

  const addUploadedFile = React.useCallback((uploadedFile: UploadedFile) => {
    setUploadedFiles((prevFiles) => [
      uploadedFile,
      ...prevFiles.filter((file) => file.name !== uploadedFile.name),
    ]);
  }, []);

  const deleteUploadedFile = async (file: UploadedFile) => {
    try {
      const { data } = await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/uploads`, {
        data: {
          name: file.name,
        },
      });

      if (data.success) {
        setUploadedFiles((prevFiles) =>
          prevFiles.filter((prevFile) => prevFile.name !== file.name),
        );
        toast.success(`${file.originalName} deleted`);
      } else {
        toast.error(`${file.originalName} delete failed`);
      }
    } catch (error) {
      console.error(error);
      toast.error(`${file.originalName} delete failed`);
    }
  }

  const onUpload = async (files: File[], { onSuccess, onError, onProgress }: {
    onProgress: (file: File, progress: number) => void;
    onSuccess: (file: File) => void;
    onError: (file: File, error: Error) => void;
  },) => {
    try {
      for (const file of files) {
        setStatus(file.name, "uploading");

        const { data } = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
          file: file
        }, {
          headers: {
            "Content-Type": "multipart/form-data"
          },
          onUploadProgress: (e) => {
            const total = e.total || 0;
            const pct = total > 0 ? Math.round((e.loaded / total) * 100) : 0;
            onProgress(file, pct);
            // Switch to embedding state once upload is nearly done
            if (pct >= 95) {
              setStatus(file.name, "embedding");
            }
          }
        },
        )
        if (data.success) {
          setStatus(file.name, "done");
          onSuccess(file);
          addUploadedFile({
            name: data.name,
            originalName: file.name,
            size: file.size,
            url: `/api/uploads/${encodeURIComponent(data.name)}`,
            uploadedAt: new Date().toISOString(),
          });
          // Clear the "done" status after a brief moment so the checkmark shows
          setTimeout(() => {
            clearStatus(file.name);
            setFiles((prevFiles) => prevFiles.filter((prevFile) => prevFile !== file));
          }, 1500);
          toast.success(`${file.name} uploaded & embedded successfully`)
        } else {
          setStatus(file.name, "error");
          onError(file, new Error("Upload failed"));
          toast.error(`${file.name} upload failed`)
          setTimeout(() => clearStatus(file.name), 3000);
        }
      }
    } catch (error) {
      for (const file of files) {
        setStatus(file.name, "error");
        onError(file, error instanceof Error ? error : new Error("Upload failed"));
        setTimeout(() => clearStatus(file.name), 3000);
      }
      toast.error(`Upload failed`)
    }
  }

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .file-status-enter {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
      <FileUpload
        maxFiles={100}
        maxSize={100 * 1024 * 1024}
        className="w-full max-w-md"
        value={files}
        onValueChange={setFiles}
        onFileReject={onFileReject}
        multiple
        onUpload={onUpload}
      >
        <FileUploadDropzone>
          <div className="flex flex-col items-center gap-1 text-center">
            <div className="flex items-center justify-center rounded-full border p-2.5">
              <HugeiconsIcon icon={File02Icon} className="size-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">Drag & drop files here</p>
            <p className="text-xs text-muted-foreground">
              Or click to browse
            </p>
          </div>
          <FileUploadTrigger asChild>
            <Button variant="outline" size="sm" className="mt-2 w-fit">
              Browse files
            </Button>
          </FileUploadTrigger>
        </FileUploadDropzone>
        <FileUploadList>
          {files.map((file, index) => {
            const status = fileStatuses.get(file.name);
            const isEmbedding = status === "embedding";
            const isDone = status === "done";
            const isError = status === "error";

            return (
              <div key={index} className="file-status-enter">
                <FileUploadItem
                  value={file}
                  className={`transition-colors duration-300 ${
                    isDone
                      ? "bg-emerald-500/20 border-emerald-500/30"
                      : isError
                        ? "bg-destructive/20 border-destructive/30"
                        : isEmbedding
                          ? "bg-primary/30 border-primary/30"
                          : "bg-primary/50"
                  }`}
                >
                  {!isEmbedding && !isDone && (
                    <FileUploadItemProgress className="bg-primary/20" variant="fill" />
                  )}
                  <FileUploadItemPreview />
                  <FileUploadItemMetadata />
                  <div className="flex items-center gap-1">
                    {isDone && (
                      <div className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-500 file-status-enter">
                        <Check className="size-3" />
                        Done
                      </div>
                    )}
                    {isError && (
                      <div className="flex items-center gap-1 rounded-full bg-destructive/20 px-2 py-0.5 text-xs text-destructive file-status-enter">
                        <X className="size-3" />
                        Failed
                      </div>
                    )}
                    {!isDone && !isEmbedding && (
                      <FileUploadItemDelete asChild>
                        <Button variant="ghost" size="icon" className="size-7">
                          <X className="size-4" />
                        </Button>
                      </FileUploadItemDelete>
                    )}
                  </div>
                </FileUploadItem>
                {isEmbedding && <EmbeddingIndicator />}
              </div>
            );
          })}
        </FileUploadList>
        {uploadedFiles.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium">Uploaded files</p>
            <div className="space-y-2">
              {uploadedFiles.map((file) => (
                <div
                  key={file.name}
                  className="flex items-center gap-3 rounded-md border bg-primary/20 p-3 text-sm transition-colors hover:bg-primary/30"
                >
                <a
                  href={file.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <HugeiconsIcon icon={File02Icon} className="size-5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{file.originalName}</span>
                    <span className="block text-xs text-muted-foreground">{formatBytes(file.size)}</span>
                  </span>
                </a>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0"
                  aria-label={`Delete ${file.originalName}`}
                  onClick={() => deleteUploadedFile(file)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              ))}
            </div>
          </div>
        )}
      </FileUpload>
    </>
  );
};

export default Example;