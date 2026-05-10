import { Chroma } from "@langchain/community/vectorstores/chroma"
import { createOpenRouterEmbeddings } from "./embedding"
import { QdrantVectorStore } from "@langchain/qdrant";

export const retrieveContext = async (query: string) => {
  const embeddings = createOpenRouterEmbeddings()
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

  const retrievedDocs = await vectorStore.similaritySearch(query, 2)
  const serialized = retrievedDocs
    .map((doc) => `Source: ${doc.metadata.source}\nContent: ${doc.pageContent}`)
    .join("\n")
  return serialized
}
