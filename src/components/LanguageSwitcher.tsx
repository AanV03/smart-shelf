"use client";

import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/lib/i18n-client";
import Image from "next/image";

export function LanguageSwitcher() {
  const { language, setLanguage } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="bg-transparent hover:bg-transparent/10 text-navbar-button-foreground focus-visible:ring-primary flex h-9 w-9 items-center justify-center rounded-md transition-colors focus-visible:ring-2"
          aria-label="Change language"
          title="Change language"
        >
          <Globe className="h-4 w-4" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => setLanguage("es")}>
          <Image
            src="https://flagcdn.com/mx.svg"
            alt="Mexico flag"
            width={24}
            height={16}
            className="mr-2 rounded"
          />
          <span className="font-medium">Español</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLanguage("en")}>
          <Image
            src="https://flagcdn.com/us.svg"
            alt="USA flag"
            width={24}
            height={16}
            className="mr-2 rounded"
          />
          <span className="font-medium">English</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
