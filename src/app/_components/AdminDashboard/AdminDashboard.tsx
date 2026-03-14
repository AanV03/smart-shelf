"use client"

import { useState } from "react"
import { Building2, Users, Settings, TrendingUp, Package, AlertCircle, Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { api } from "@/trpc/react"
import { format } from "date-fns"

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState("overview")

    // Fetch dashboard stats
    const { data: stats, isLoading: statsLoading } = api.stats.getDashboardStats.useQuery()

    // Fetch alerts
    const { data: alerts, isLoading: alertsLoading } = api.alerts.getAlerts.useQuery({
        isRead: false,
        limit: 10,
    })

    return (
        <div className="relative w-full overflow-hidden">
            {/* Animated gradient background */}
            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob opacity-70" />
                <div className="absolute -bottom-40 right-0 w-96 h-96 bg-destructive/15 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000 opacity-50" />
                <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000 opacity-40" />
            </div>

            <div className="relative z-10">
                <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
                    {/* Hero section */}
                    <div className="mb-10">
                        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2 flex items-center gap-2">
                            <Building2 className="h-8 w-8 text-primary" />
                            Admin Dashboard
                        </h1>
                        <p className="text-lg text-muted-foreground">
                            Manage your store, team members, and system configuration
                        </p>
                    </div>

                    {/* Stats Cards */}
                    <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Total Inventory Value */}
                        <Card className="border-border/50 bg-linear-to-br from-card to-card/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-2">Inventory Value</p>
                                        <p className="text-2xl font-bold text-foreground tabular-nums">
                                            {statsLoading ? "—" : `$${(stats?.totalInventoryValue ?? 0).toLocaleString(undefined, {
                                                minimumFractionDigits: 0,
                                                maximumFractionDigits: 0,
                                            })}`}
                                        </p>
                                    </div>
                                    <div className="rounded-lg bg-primary/15 p-3">
                                        <TrendingUp className="h-6 w-6 text-primary" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Active Products */}
                        <Card className="border-border/50 bg-linear-to-br from-card to-card/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-2">Products</p>
                                        <p className="text-2xl font-bold text-foreground tabular-nums">
                                            {statsLoading ? "—" : stats?.activeProductCount ?? 0}
                                        </p>
                                    </div>
                                    <div className="rounded-lg bg-primary/15 p-3">
                                        <Package className="h-6 w-6 text-primary" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Team Members */}
                        <Card className="border-border/50 bg-linear-to-br from-card to-card/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-2">Team Members</p>
                                        <p className="text-2xl font-bold text-foreground tabular-nums">
                                            —
                                        </p>
                                    </div>
                                    <div className="rounded-lg bg-primary/15 p-3">
                                        <Users className="h-6 w-6 text-primary" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* System Status */}
                        <Card className="border-border/50 bg-linear-to-br from-card to-card/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-2">Status</p>
                                        <Badge className="bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30">
                                            Operational
                                        </Badge>
                                    </div>
                                    <div className="rounded-lg bg-green-500/15 p-3">
                                        <Settings className="h-6 w-6 text-green-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Tab Section */}
                    <Card className="border-border/50 bg-linear-to-br from-card via-card/95 to-card/80 backdrop-blur-xl shadow-xl">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <div className="border-b border-border/30 px-6 pt-6">
                                <TabsList className="grid w-full grid-cols-4 bg-secondary/20 border border-border/30">
                                    <TabsTrigger value="overview" className="rounded-md">Overview</TabsTrigger>
                                    <TabsTrigger value="team" className="rounded-md">Team</TabsTrigger>
                                    <TabsTrigger value="alerts" className="rounded-md">Alerts</TabsTrigger>
                                    <TabsTrigger value="settings" className="rounded-md">Settings</TabsTrigger>
                                </TabsList>
                            </div>

                            {/* Overview Tab */}
                            <TabsContent value="overview" className="mt-6 px-6 pb-6">
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-foreground mb-4">
                                            Store Configuration
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="rounded-lg border border-border/30 p-4 flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium text-foreground">Store Name</p>
                                                    <p className="text-sm text-muted-foreground">Your main store</p>
                                                </div>
                                                <Button variant="outline" size="sm">Edit</Button>
                                            </div>
                                            <div className="rounded-lg border border-border/30 p-4 flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium text-foreground">Store Location</p>
                                                    <p className="text-sm text-muted-foreground">Update address</p>
                                                </div>
                                                <Button variant="outline" size="sm">Edit</Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Team Tab */}
                            <TabsContent value="team" className="mt-6 px-6 pb-6">
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-foreground">
                                        Manage Team Members
                                    </h3>
                                    <div className="rounded-lg border border-border/30 bg-secondary/30 p-8 text-center">
                                        <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                                        <p className="text-sm text-muted-foreground">Coming soon</p>
                                        <p className="text-xs text-muted-foreground/70 mt-2">Invite team members and manage their roles</p>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Alerts Tab */}
                            <TabsContent value="alerts" className="mt-6 px-6 pb-6">
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-foreground">
                                        Recent Alerts
                                    </h3>
                                    {alertsLoading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                        </div>
                                    ) : alerts?.alerts && alerts.alerts.length > 0 ? (
                                        <div className="space-y-2">
                                            {alerts.alerts.map((alert) => (
                                                <div
                                                    key={alert.id}
                                                    className="rounded-lg border border-border/30 p-4 flex items-start gap-3"
                                                >
                                                    <AlertCircle className="h-5 w-5 text-warning mt-1 shrink-0" />
                                                    <div className="flex-1">
                                                        <p className="font-medium text-foreground text-sm">{alert.message}</p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {format(new Date(alert.createdAt), "PPp")}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="rounded-lg border border-border/30 bg-secondary/30 p-8 text-center">
                                            <p className="text-sm text-muted-foreground">No alerts</p>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            {/* Settings Tab */}
                            <TabsContent value="settings" className="mt-6 px-6 pb-6">
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-foreground">
                                        System Settings
                                    </h3>
                                    <div className="rounded-lg border border-border/30 bg-secondary/30 p-8 text-center">
                                        <Settings className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                                        <p className="text-sm text-muted-foreground">Coming soon</p>
                                        <p className="text-xs text-muted-foreground/70 mt-2">Configure advanced settings for your store</p>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </Card>
                </main>
            </div>
        </div>
    )
}
