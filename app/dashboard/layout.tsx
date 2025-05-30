import Link from "next/link";
import { ReactNode } from "react";
import Image from "next/image";
import { DashboardLinks } from "../components/DashboardLinks";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { ModeToggle } from "../components/ThemeToggle";

export default function DashboardLayout({children}: {children: ReactNode}) {
    return (
        <>
            <div className="min-h-screen 
            w-full 
            grid 
            md:grid-cols-[220px_1fr]
            lg:gird-cols-[280px_1fr]">
               <div className="hidden md:block border-r bg-muted/40">
                    <div className="flex h-full max-h-screen flex-col gap-2">
                        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                            <Link href="/" className="flex items-center gap-2">
                                <Image src="/logo.png" alt="Logo" width={30} height={30} className="rounded-lg" />
                                <p className="text-xl font-bold">
                                    Ne<span className="text-primary">Bula</span> 
                                </p>
                            </Link>
                        </div>

                        <div className="flex-1">
                            <nav className="grid items-start px-2 lg:px-4">
                                <DashboardLinks />
                            </nav>
                        </div>
                    </div>
               </div> 

               <div className="flex flex-col">
                    <header className="flex h-14 items-center gap-4 border-b  bg-muted/40 px-4 lg:h-[60px] lg:px-6">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button className="md:hidden shrink-0" size="icon" variant="outline">
                                    <Menu className="size-5"/>
                                </Button>
                            </SheetTrigger>

                            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>

                            <SheetContent side="left" className="flex flex-col">
                                <nav className="grid gap-2 mt-10">
                                    <DashboardLinks />
                                </nav>
                            </SheetContent>
                        </Sheet>

                        <div className="ml-auto flex items-center gap-x-4">
                            <ModeToggle />
                        </div>
                    </header>
                </div> 
            </div>
        </>
    )
}