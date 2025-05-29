import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";

export default function DashboardLayout({children}: {children: ReactNode}) {
  return (
    <>
        <div className="min-h-screen w-full grid md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
            <div className="hidden md:block border-r bg-muted/40">
                <div className="flex h-full max-h-screen flex-col gap-2">
                    <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6 gap-2">
                        <Link href="/" className ="flex items-center gap-2">
                            <Image 
                                src="/logo.png"
                                alt="Logo"
                                width={30}
                                height={30}
                                className="rounded-lg"
                            />
                        </Link>

                        <p className = "text-primary text-3xl font-bold">
                            <span className="text-black">Ne</span>Bula
                        </p>

                    </div>
                </div>
            </div>
            <main className="flex flex-col overflow-hidden">
                {children}
            </main>
        </div>
    </>
  );
}
