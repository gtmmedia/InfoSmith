"use client"
import { useState } from "react";
import Chat from "./Chat";
import Hero from "./Hero";
import { ChatMessages } from "@openrouter/sdk/models";
import ChatHistory from "./ChatHistory";

export default function Home() {
    const [input,setInput] = useState<string>("");
    const [messages,setMessages] = useState<ChatMessages[]>([]);
    const hasMessages = messages.length > 0;

    return (
        <div className="relative flex min-h-0 w-full flex-1 flex-col px-4">
            {!hasMessages && (
                <div className="flex flex-1 items-center justify-center">
                    <Hero />
                </div>
            )}
            {hasMessages && (
                <div className="flex-1 overflow-y-auto pt-8">
                    <ChatHistory messages={messages}/>
                </div>
            )}
            <div className="sticky bottom-0 z-20 w-full bg-background py-4">
                <Chat input={input} setInput={setInput} messages={messages} setMessages={setMessages} />
            </div>
        </div>
    )
}