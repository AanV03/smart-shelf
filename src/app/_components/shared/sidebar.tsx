"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useCallback } from "react";
import {
  Package,
  BarChart3,
  Home,
  Grid3x3,
  ChevronDown,
  Users,
  Settings,
  CreditCard,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n-client";

interface AppSidebarProps {
  role?: "ADMIN" | "MANAGER" | "EMPLOYEE";
}

interface NavItem {
  id: string;
  href?: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isNew?: boolean;
  children?: NavItem[] | undefined;
}

export function AppSidebar({ role = "EMPLOYEE" }: AppSidebarProps) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const { t } = useI18n();

  // Manager navigation with operational focus (inventory, reports, catalog)
  const managerNav: NavItem[] = [
    {
      id: "home",
      href: "/dashboard",
      label: t.sidebar.home,
      icon: Home,
    },
    {
      id: "inventory-fefo",
      href: "/dashboard/inventory",
      label: t.sidebar.inventory,
      icon: Grid3x3,
    },
    {
      id: "analytics",
      href: "/dashboard/analytics",
      label: t.sidebar.reports,
      icon: BarChart3,
    },
  ];

// Admin navigation - Store management only (NOT inventory/reports)
const adminNav: NavItem[] = [
  {
    id: "home",
    href: "/dashboard",
    label: t.sidebar.home,
    icon: Home,
  },
  {
    id: "team-group",
    label: t.sidebar.management,
    icon: Users,
    children: [
      {
        id: "team-management",
        href: "/dashboard/team",
        label: t.sidebar.team,
        icon: Users,
      },
      {
        id: "store-settings",
        href: "/dashboard/settings",
        label: t.sidebar.settings,
        icon: Settings,
      },
    ],
  },
  {
    id: "plans",
    href: "/dashboard/plans",
    label: t.sidebar.plans,
    icon: CreditCard,
  },
];

// Employee navigation - Floor operations only (batch entry, inventory)
const employeeNav: NavItem[] = [
  {
    id: "home",
    href: "/dashboard",
    label: t.sidebar.home,
    icon: Home,
  },
  {
    id: "batch-entry",
    href: "/dashboard/batch-entry",
    label: t.sidebar.batchEntry,
    icon: Grid3x3,
  },
  {
    id: "inventory",
    href: "/dashboard/inventory",
    label: t.sidebar.fefoInventory,
    icon: Package,
  },
];

const navItems =
  role === "ADMIN" ? adminNav : role === "MANAGER" ? managerNav : employeeNav;

const isPathActive = useCallback(
  (href?: string) => {
    if (!href) return false;
    return pathname === href || pathname.startsWith(href + "/");
  },
  [pathname],
);

return (
  <Sidebar
    collapsible="icon"
    variant="sidebar"
    className="sidebar-gradient-bg border-sidebar-border"
  >
    {/* HEADER - LOGO */}
    <SidebarHeader className="border-sidebar-border flex h-16 items-center border-b px-2">
      <div className="flex flex-1 items-center gap-2">
        <div className="bg-primary flex size-8 flex-shrink-0 items-center justify-center rounded-md">
          <Package
            className="text-primary-foreground size-5"
            aria-hidden="true"
          />
        </div>
        <h1 className="text-sidebar-foreground overflow-hidden text-sm font-bold tracking-tight whitespace-nowrap group-data-[collapsible=icon]:hidden">
          Smart-Shelf
        </h1>
      </div>
    </SidebarHeader>

    {/* CONTENT - NAVIGATION */}
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {navItems.map((item) => {
              const hasChildren = item.children && item.children.length > 0;
              const isActive =
                isPathActive(item.href) ||
                (hasChildren &&
                  item.children?.some((child) => isPathActive(child.href)));

              if (!hasChildren) {
                // Simple menu item without children
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                    >
                      <Link href={item.href!}>
                        <item.icon aria-hidden="true" />
                        <span>{item.label}</span>
                        {item.isNew && (
                          <Badge
                            variant="default"
                            className="ml-auto h-5 px-1.5 py-0 text-xs"
                          >
                            {t.sidebar.new}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              }

              // Collapsible group with children
              return (
                <Collapsible
                  key={item.id}
                  defaultOpen={isActive}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={item.label}
                        className="data-[state=open]:bg-accent"
                      >
                        <item.icon aria-hidden="true" />
                        <span>{item.label}</span>
                        <ChevronDown
                          className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180"
                          aria-hidden="true"
                        />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.children?.map((child) => {
                          const childIsActive = isPathActive(child.href);
                          return (
                            <SidebarMenuSubItem key={child.id}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={childIsActive}
                              >
                                <Link href={child.href!}>
                                  <child.icon aria-hidden="true" />
                                  <span>{child.label}</span>
                                  {child.isNew && (
                                    <Badge
                                      variant="default"
                                      className="ml-auto h-4 px-1 py-0 text-xs"
                                    >
                                      {t.sidebar.new}
                                    </Badge>
                                  )}
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>

    {/* SEPARATOR */}
    <SidebarSeparator className="my-0 mx-0 w-full" />

    {/* FOOTER - ROLE */}
    <SidebarFooter className="flex h-16 items-center justify-between border-t-0 px-2">
      <div className="text-sidebar-foreground/70 text-xs">
        <span className="group-data-[collapsible=icon]:hidden">
          © Smart-Shelf
        </span>
        <span className="hidden group-data-[collapsible=icon]:inline">©</span>
      </div>
      {isMobile && (
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden"
          onClick={() => setOpenMobile(false)}
          aria-label="Close sidebar"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
      )}
    </SidebarFooter>
  </Sidebar>
);
}
