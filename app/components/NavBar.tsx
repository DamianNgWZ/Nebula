import Link from "next/link";
import Image from "next/image";
import { AuthModal } from "./AuthModal";

export function NavBar() {
    return (
        <div className="flex py-5 items-center justify-between">
            <Link href = "/" className = "flex items-center gap-2">
                <Image 
                    src = "/logo.png"
                    alt = "Logo" 
                    width = {40}
                    height = {40}
                    className = "rounded-lg shadow-lg" 
                /> 
                <div className="text-3xl font-semibold">
                    <span className="text-gray-800">Ne</span>
                    <span className="text-blue-500">Bula</span>
                </div>
            </Link>

            <AuthModal />
        </div>
    )
}