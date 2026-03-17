"use client";

import { signIn } from "next-auth/react";

export function RegisterOAuthSection() {
    const handleComingSoon = () => {
        alert("Esta opción estará disponible próximamente");
    };

    return (
        <div className="flex flex-col items-center justify-start space-y-5 w-full mt-1 mb-1">
            {/* Divider */}
            <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                    <div className="border-border/30 w-full border-t"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="text-muted-foreground px-2 text-xs">
                        O continúa con
                    </span>
                </div>
            </div>

            {/* OAuth Buttons */}
            <div className="grid grid-cols-1 gap-3 w-full">
                <button
                    type="button"
                    onClick={() =>
                        signIn("google", { redirect: true, callbackUrl: "/dashboard" })
                    }
                    className="bg-secondary/50 hover:bg-secondary hover:text-secondary-foreground text-foreground border-border/30 focus-visible:ring-primary focus-visible:ring-offset-background flex h-11 w-full items-center justify-center gap-2 rounded-lg border transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50"
                >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                            fill="currentColor"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                            fill="currentColor"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                            fill="currentColor"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                    </svg>
                    <span className="text-sm font-medium">Continuar con Google</span>
                </button>

                <button
                    type="button"
                    onClick={() =>
                        signIn("discord", { redirect: true, callbackUrl: "/dashboard" })
                    }
                    className="bg-secondary/50 hover:bg-secondary hover:text-secondary-foreground text-foreground border-border/30 focus-visible:ring-primary focus-visible:ring-offset-background flex h-11 w-full items-center justify-center gap-2 rounded-lg border transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50"
                >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.317 4.3702a19.8 19.8 0 0 0-4.885-1.515a.07.07 0 0 0-.079.0336c-.211.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0c-.165-.386-.398-.875-.609-1.25a.07.07 0 0 0-.079-.0336A19.773 19.773 0 0 0 3.677 4.37a.07.07 0 0 0-.032.0277C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.975 14.975 0 0 0 1.293-2.1a.07.07 0 0 0-.038-.1a13.114 13.114 0 0 1-1.872-.892a.072.072 0 0 1-.009-.119c.125-.093.25-.19.371-.287a.075.075 0 0 1 .078-.01c3.928 1.793 8.18 1.793 12.062 0a.075.075 0 0 1 .079.009c.12.098.245.195.371.288a.072.072 0 0 1-.01.119a12.96 12.96 0 0 1-1.873.892a.07.07 0 0 0-.038.1a15 15 0 0 0 1.294 2.1a.07.07 0 0 0 .084.028a19.963 19.963 0 0 0 6.002-3.03a.083.083 0 0 0 .032-.056c.361-4.334-.635-8.793-2.685-12.794a.07.07 0 0 0-.032-.028zM8.359 15.864c-1.195 0-2.182-.977-2.182-2.18c0-1.204.973-2.181 2.182-2.181c1.21 0 2.2.977 2.182 2.181c0 1.203-.973 2.18-2.182 2.18zm7.294 0c-1.195 0-2.182-.977-2.182-2.18c0-1.204.973-2.181 2.182-2.181c1.21 0 2.198.977 2.182 2.181c0 1.203-.972 2.18-2.182 2.18z" />
                    </svg>
                    <span className="text-sm font-medium">Continuar con Discord</span>
                </button>

                <button
                    type="button"
                    onClick={handleComingSoon}
                    className="bg-secondary/50 hover:bg-secondary hover:text-secondary-foreground text-foreground border-border/30 focus-visible:ring-primary focus-visible:ring-offset-background flex h-11 w-full items-center justify-center gap-2 rounded-lg border transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50"
                >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.4 24c6.3 0 9.9-5.1 9.9-9.9 0-.2 0-.4 0-.6 1.2-.9 2.3-2 3.1-3.3-.4.2-.9.3-1.5.4.5-.3 1.1-.8 1.4-1.4-.5.3-1 .5-1.6.7-.4-.5-1.1-.8-1.8-.8-1.4 0-2.5 1.1-2.5 2.5 0 .2 0 .4 0 .6-2 0-3.9-1.1-5.1-2.6-.2.4-.4.9-.4 1.4 0 .8.4 1.6 1.1 2.1-.4 0-.8-.1-1.2-.3 0 1.2.9 2.3 2 2.6-.2 0-.4.1-.6.1-.1 0-.3 0-.4 0 .3 1.1 1.2 1.9 2.3 1.9-1 .7-2.1 1.2-3.4 1.2H11c1.1.7 2.5 1.1 3.9 1.1z"/>
                    </svg>
                    <span className="text-sm font-medium">Continuar con Microsoft</span>
                </button>

                <button
                    type="button"
                    onClick={handleComingSoon}
                    className="bg-secondary/50 hover:bg-secondary hover:text-secondary-foreground text-foreground border-border/30 focus-visible:ring-primary focus-visible:ring-offset-background flex h-11 w-full items-center justify-center gap-2 rounded-lg border transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50"
                >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    <span className="text-sm font-medium">Continuar con GitHub</span>
                </button>
            </div>
        </div>
    );
}
