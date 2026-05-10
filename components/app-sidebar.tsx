import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
} from "@/components/ui/sidebar"
import Example from "./file-upload-dropzone-1"

export function AppSidebar() {
    return (
        <Sidebar >
            <SidebarHeader />
            <SidebarContent>
                <SidebarGroup className="font-bold text-center text-xl">
                    Upload Your Files Here
                </SidebarGroup>
                <SidebarGroup>
                    <Example />
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter />
        </Sidebar>
    )
}