import { AiBrain01Icon, CursorInfo01Icon, UserIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ChatMessages } from "@openrouter/sdk/models";
import ThinkingIndicator from "./ThinkingIndicator";

const roleStyles = {
    user: "bg-primary text-primary-foreground ml-auto rounded-xl rounded-br-none",
    assistant: "bg-muted text-foreground mr-auto rounded-xl rounded-bl-none",
    system: "bg-background text-muted-foreground mx-auto italic border border-border",
};

export default function ChatHistory({ messages }: { messages: ChatMessages[] }) {
    return (
        <div className="flex w-full flex-col gap-4 py-8">
            {messages.map((message, index) => {
                const isUser = message.role === "user";
                const isAssistant = message.role === "assistant";
                const isSystem = message.role === "system";
                const isThinking = isAssistant && !message.content?.trim();

                let bubbleClasses = "max-w-lg px-4 py-3 whitespace-pre-line shadow-sm ";
                if (isUser) {
                    bubbleClasses += roleStyles.user + " self-end";
                } else if (isAssistant) {
                    bubbleClasses += roleStyles.assistant + " self-start";
                } else if (isSystem) {
                    bubbleClasses += roleStyles.system + " self-center text-sm";
                }

                let avatarBg = isUser
                    ? "bg-primary text-primary-foreground"
                    : isAssistant
                        ? "bg-muted text-muted-foreground"
                        : "bg-border text-muted-foreground";

                let avatar = isUser
                    ? <HugeiconsIcon icon={UserIcon} strokeWidth={2} className="w-5 h-5" />
                    : isAssistant 
                        ? <span className="w-5 h-5 flex items-center justify-center">
                            <HugeiconsIcon icon={AiBrain01Icon} strokeWidth={2} className="w-5 h-5" />
                          </span>
                        : <HugeiconsIcon icon={CursorInfo01Icon} strokeWidth={2} className="w-5 h-5" />;

                return (
                    <div className={`flex items-start gap-3 ${isUser ? "justify-end" : isAssistant ? "justify-start" : "justify-center"}`} key={index}>
                        {!isUser &&
                            <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${avatarBg}`}>
                                {avatar}
                            </div>
                        }
                   
                   
                        <div className={bubbleClasses}>
                            {isThinking ? <ThinkingIndicator /> : message.content}
                        </div>
                        {isUser &&
                            <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${avatarBg}`}>
                                {avatar}
                            </div>
                        }
                    </div>
                );
            })}
        </div>
    )
}