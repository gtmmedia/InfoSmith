"use client"
import { ArrowUp01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Dispatch, SetStateAction } from "react"
import { ChatMessages } from "@openrouter/sdk/models"

export default function Chat({ input, setInput, messages, setMessages }: {
    input: string,
    setInput: Dispatch<SetStateAction<string>>
    messages: ChatMessages[]
    setMessages: Dispatch<SetStateAction<ChatMessages[]>>
}) {
    const hasMessages = messages.length > 0;

    const handleSend = async () => {
        const query = input.trim();
        if (!query) return;

        try {
            setMessages((prevMessages) => [
                ...prevMessages,
                {
                    role: "user",
                    content: query
                },
                {
                    role: "assistant",
                    content: ""
                }
            ])
            setInput("");
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat`, {
                method: "POST",
                body: JSON.stringify({ query }),
                headers: {
                    "Content-Type": "application/json"
                }
            })
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            while (reader) {
                const { value, done } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                setMessages((prev) => {
                    const next = [...prev];
                    const assistantIndex = next.findLastIndex((message) => message.role === "assistant");
                    const assistantMessage = next[assistantIndex];

                    if (assistantMessage) {
                        next[assistantIndex] = {
                            ...assistantMessage,
                            content: `${assistantMessage.content ?? ""}${chunk}`,
                        };
                    }

                    return next;
                });
            }
        } catch (error) {
            console.error(error);
        }
    }
    return (
        <div className="flex w-full justify-center">
            <div className="relative w-full max-w-3xl">
                <Input
                    value={input}
                    className="h-10 min-h-10 rounded-full py-2 pr-12 pl-4 shadow-sm"
                    placeholder="Message InfoSmith..."
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                />
                <div className="pointer-events-none absolute inset-y-0 right-1 z-10 flex items-center">
                    <Button
                        type="submit"
                        size="icon-sm"
                        variant="default"
                        aria-label="Send message"
                        className="pointer-events-auto rounded-full shadow-sm touch-manipulation active:translate-y-0!"
                        onClick={handleSend}
                    >
                        <HugeiconsIcon icon={ArrowUp01Icon} strokeWidth={2} className="size-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}