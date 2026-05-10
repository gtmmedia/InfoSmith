import path from "node:path"
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters"
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv"
import { TextLoader } from "@langchain/classic/document_loaders/fs/text"
import { Chroma } from "@langchain/community/vectorstores/chroma"
import { createOpenRouterEmbeddings } from "./embedding"
import { getUploadsDir } from "./uploads"
import { QdrantVectorStore } from "@langchain/qdrant";

const textExtensions = new Set([
  ".txt",
  ".md",
  ".json",
  ".html",
  ".xml",
  ".js",
  ".ts",
  ".tsx",
  ".jsx",
])

export const ingestFile = async (file: File, storedFileName?: string) => {
  try {
    const fileName = storedFileName ?? file.name
    const filePath = path.join(getUploadsDir(), fileName)
    const extension = path.extname(fileName).toLowerCase()
    let docs
    if (file.type === "application/pdf" || extension === ".pdf") {
      const loader = new PDFLoader(filePath)
      docs = await loader.load()
    } else if (file.type === "text/csv" || extension === ".csv") {
      const loader = new CSVLoader(filePath)
      docs = await loader.load()
    } else if (file.type.startsWith("text/") || textExtensions.has(extension)) {
      const loader = new TextLoader(filePath)
      docs = await loader.load()
    } else {
      throw new Error(`Unsupported file type: ${file.type || extension || file.name}`)
    }

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 150,
    })

    const splits = await splitter.splitDocuments(docs)

    for (const doc of splits) {
      for (const key of Object.keys(doc.metadata)) {
        const val = doc.metadata[key]
        if (
          val !== null &&
          typeof val !== "string" &&
          typeof val !== "number" &&
          typeof val !== "boolean"
        ) {
          delete doc.metadata[key]
        }
      }
    }

    const embeddings = createOpenRouterEmbeddings()
    if (!embeddings) {
      throw new Error("Embeddings not created");
    }
    // const vectorStore = new Chroma(embeddings, {
    //   collectionName: "assignment-3",
    //   chromaCloudAPIKey: process.env.CHROMA_API_KEY,
    //   clientParams: {
    //     host: "api.trychroma.com",
    //     port: 8000,
    //     ssl: true,
    //     tenant: process.env.CHROMA_TENANT,
    //     database: process.env.CHROMA_DATABASE,
    //   },
    // })

    const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
      url: process.env.QDRANT_URL,
      collectionName: "assignment-3",
      apiKey: process.env.QDRANT_API_KEY,
    });

    await vectorStore.addDocuments(splits)

    console.log("added document embeddings to vector store");
  } catch (error) {
    console.error(error);
    throw error;
  }
}
