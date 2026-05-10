export default function ThinkingIndicator() {
    return (
        <div className="flex items-center gap-1 py-1" aria-label="AI is thinking">
            <span className="size-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
            <span className="size-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
            <span className="size-2 animate-bounce rounded-full bg-muted-foreground" />
        </div>
    );
}