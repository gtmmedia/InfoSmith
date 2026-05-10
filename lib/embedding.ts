import { OpenAIEmbeddings } from "@langchain/openai"

export function createOpenRouterEmbeddings() {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set")
  }

  return new OpenAIEmbeddings({
    model: "nvidia/llama-nemotron-embed-vl-1b-v2:free",
    apiKey,
    encodingFormat: "float",
    configuration: {
      baseURL: "https://openrouter.ai/api/v1",
      ...(process.env.OPENROUTER_HTTP_REFERER
        ? {
          defaultHeaders: {
            "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER,
          },
        }
        : {}),
    },
  })
}
