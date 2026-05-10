import { ChatMessage } from "@langchain/core/messages"
import { client } from "./openrouter"
import { SYSTEM_PROMPT } from "./prompt"
import { retrieveContext } from "./retrieve"
import { ChatMessages, ChatRequest } from "@openrouter/sdk/models"

export const chat = async (query: string) => {
  const context = await retrieveContext(query)
  let messages = [{
    role: "system",
    content: SYSTEM_PROMPT.replace("{{document}}", context),
  },
  {
    role: "user",
    content: query,
  }
  ] as ChatMessages[]
  const res = await client.chat.send({
    chatRequest: {
      model: "openai/gpt-oss-120b:free",
      messages
    },
  })
  messages.push({
    role: "assistant",
    content: res.choices[0].message.content,
  })
  return res.choices[0].message.content
}

export const chatStream = async (query: string) => {
  const context = await retrieveContext(query)
  let messages = [{
    role: "system",
    content: SYSTEM_PROMPT.replace("{{document}}", context).replace("{{question}}", query),
  },
  {
    role: "user",
    content: query,
  }
  ] as ChatMessages[]
  const stream = await client.chat.send({
    chatRequest: {
      model: "openai/gpt-oss-120b:free",
      messages,
      stream: true
    },
  })
  const encoder = new TextEncoder();
  let response = "";
  const streamOutput = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content;
          response += content;
          if (content) {
            controller.enqueue(encoder.encode(content));
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
  messages.push({
    role: "assistant",
    content: response
  })
  return streamOutput;
}
