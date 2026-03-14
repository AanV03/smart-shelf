"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const products = [
  { value: "sku-001", label: "Organic Whole Milk (1 Gal)", category: "Dairy" },
  { value: "sku-002", label: "Free-Range Eggs (Dozen)", category: "Dairy" },
  { value: "sku-003", label: "Greek Yogurt (32oz)", category: "Dairy" },
  { value: "sku-004", label: "Sourdough Bread Loaf", category: "Bakery" },
  {
    value: "sku-005",
    label: "Fresh Atlantic Salmon (1lb)",
    category: "Seafood",
  },
  { value: "sku-006", label: "Baby Spinach (10oz bag)", category: "Produce" },
  { value: "sku-007", label: "Cheddar Cheese Block (8oz)", category: "Dairy" },
  { value: "sku-008", label: "Ground Turkey (1lb)", category: "Meat" },
  { value: "sku-009", label: "Almond Butter (16oz)", category: "Pantry" },
  { value: "sku-010", label: "Kombucha Ginger (16oz)", category: "Beverages" },
];

interface ProductComboboxProps {
  value: string;
  onChange: (value: string) => void;
  id: string;
  "aria-required"?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

export function ProductCombobox({
  value,
  onChange,
  id,
  ...ariaProps
}: ProductComboboxProps) {
  const [open, setOpen] = useState(false);

  const selectedProduct = products.find((p) => p.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          className="border-border/60 bg-secondary/40 text-foreground hover:bg-secondary/70 hover:text-foreground focus-visible:ring-primary focus-visible:ring-offset-background h-10 w-full justify-between focus-visible:ring-2 focus-visible:ring-offset-2"
          {...ariaProps}
        >
          {selectedProduct ? (
            <span className="flex items-center gap-2 truncate">
              <Search
                className="text-muted-foreground size-3.5"
                aria-hidden="true"
              />
              {selectedProduct.label}
            </span>
          ) : (
            <span className="text-muted-foreground">Search products...</span>
          )}
          <ChevronsUpDown
            className="ml-2 size-4 shrink-0 opacity-50"
            aria-hidden="true"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="border-border/60 bg-card w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command className="bg-transparent">
          <CommandInput
            placeholder="Search by name or SKU..."
            className="text-foreground"
          />
          <CommandList>
            <CommandEmpty className="text-muted-foreground">
              No product found.
            </CommandEmpty>
            {[
              "Dairy",
              "Bakery",
              "Seafood",
              "Produce",
              "Meat",
              "Pantry",
              "Beverages",
            ].map((category) => {
              const categoryProducts = products.filter(
                (p) => p.category === category,
              );
              if (categoryProducts.length === 0) return null;
              return (
                <CommandGroup
                  key={category}
                  heading={category}
                  className="text-muted-foreground"
                >
                  {categoryProducts.map((product) => (
                    <CommandItem
                      key={product.value}
                      value={product.label}
                      onSelect={() => {
                        onChange(product.value === value ? "" : product.value);
                        setOpen(false);
                      }}
                      className="text-foreground"
                    >
                      <Check
                        className={cn(
                          "text-primary mr-2 size-4",
                          value === product.value ? "opacity-100" : "opacity-0",
                        )}
                        aria-hidden="true"
                      />
                      <span>{product.label}</span>
                      <span className="text-muted-foreground ml-auto font-mono text-[10px]">
                        {product.value.toUpperCase()}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
