import prisma from "@/app/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound } from "next/navigation";

async function getData(userId: string) {
    const data = await prisma.availability.findMany({
        where: {
            userId: userId,
        },
    });

    if (!data) {
        return notFound();
    }

    return data;
}

export default function AvailabilityRoute() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Availability</CardTitle>
                <CardDescription>
                    Update your availability!
                </CardDescription>
            </CardHeader>
            <form >
                <CardContent>
                    
                </CardContent>
            </form>
        </Card>
    )
}