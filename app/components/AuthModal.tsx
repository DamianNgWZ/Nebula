import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Image from "next/image";

export function AuthModal() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button>
                    Sign In / Sign Up
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[370px] fixed top-1/2 left-1/2 !-translate-x-1/2 !-translate-y-1/2">
                <DialogHeader className="flex flex-col items-center text-center space-y-4">
                    <Image 
                        src="/logo.png"
                        alt="Logo"
                        width={40}
                        height={40}
                        className="rounded-lg"
                    />
                    <DialogTitle className = "text-primary">
                        Sign In / Sign Up
                    </DialogTitle>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    );
}

