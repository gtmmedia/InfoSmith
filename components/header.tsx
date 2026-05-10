import { SidebarTrigger } from "./ui/sidebar";

export default function Header() {
    return (
        <header className="w-full sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/80">
            <div className="flex items-center gap-3">
                <SidebarTrigger className="-ml-1" />
                <div>
                    <h1 className="text-lg font-semibold tracking-tight">ScalerbookLM</h1>
                </div>
            </div>
        </header>
    )
}