"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "./SubmitButtons";
import { useActionState, useState } from "react";
import { SettingsAction } from "../actions";
import { useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import { settingsScheme } from "../lib/zodSchemas";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface iAppProps {
    fullName: string;
    email: string;
    profileImage: string;
}

export function SettingsForm({ email, fullName, profileImage }: iAppProps) {
    const [lastResult, action] = useActionState(SettingsAction, undefined);
    const [currentProfileImage, setCurrentProfileImage] = useState(profileImage);
    const [form, fields] = useForm({
        lastResult,

        onValidate({formData}) {
            return parseWithZod(formData, {
                schema: settingsScheme,
            });
        },

        shouldValidate: "onBlur",
        shouldRevalidate: "onInput"
    });
    const handleDeleteImage = () => {
        setCurrentProfileImage("");
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Settings</CardTitle>
                <CardDescription>Manage your account settings.</CardDescription>
            </CardHeader>

            <form id={form.id} onSubmit={form.onSubmit} action={action} noValidate>
                <CardContent className="flex flex-col gap-y-4">
                    <div className="flex flex-col gap-y-2">
                        <Label>Full Name</Label>
                        <Input name={fields.fullName.name} key={fields.fullName.key} defaultValue={fullName} placeholder="John Doe" />
                        <p className="text-red-500 text-sm">{fields.fullName.errors}</p>
                    </div>
                    <div className="flex flex-col gap-y-2">
                        <Label>Email</Label>
                        <Input disabled defaultValue={email} placeholder="abc@gmail.com" />
                    </div>
                    <div className="grid gap y-2">
                        <Label>Profile Image</Label>
                        <div style={{ height: '1rem' }} />
                        {currentProfileImage ? (
                                <div className="relative size-16">
                                    <img 
                                        src={currentProfileImage}
                                        alt="Profile Image"
                                        className="size-16 rounded-lg"
                                    />

                                    <Button 
                                        onClick={handleDeleteImage}
                                        variant="destructive"  
                                        size="icon"
                                        type="button" 
                                        className="absolute -top-3 -right-3"
                                    >
                                        <X className="size-3" />
                                    </Button>
                                </div>
                            ) : (
                                <h1>No Image</h1>
                            )
                        }
                    </div>
                </CardContent>
                <div style={{ height: '1rem' }} />
                <CardFooter>
                    <SubmitButton text="Save Changes" />
                </CardFooter>
            </form>
        </Card>  
    );
}