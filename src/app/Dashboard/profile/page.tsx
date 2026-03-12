import { getServerAuthSession } from "@/server/auth"
import { redirect } from "next/navigation"
import { Card } from "@/components/ui/card"
import { User, Mail, Shield, Calendar } from "lucide-react"
import { format } from "date-fns"

export default async function ProfilePage() {
  const session = await getServerAuthSession()

  if (!session) {
    return redirect("/api/auth/signin")
  }

  const user = session.user

  return (
    <div className="relative w-full overflow-hidden">
      {/* Animated gradient background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob opacity-70" />
        <div className="absolute -bottom-40 right-0 w-96 h-96 bg-secondary/15 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000 opacity-50" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000 opacity-40" />
      </div>

      <div className="relative z-10">
        <main className="mx-auto max-w-2xl px-4 py-8 lg:px-8">
          {/* Hero section */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2">
              My Profile
            </h1>
            <p className="text-lg text-muted-foreground">
              View and manage your account information
            </p>
          </div>

          {/* Profile Card */}
          <Card className="border-border/50 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm shadow-lg p-6">
            <h2 className="flex items-center gap-2 text-xl font-bold mb-6 text-foreground">
              <User className="size-5" />
              Account Information
            </h2>
            <div className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                <div className="rounded-lg border border-border/30 bg-secondary/30 px-4 py-3">
                  <p className="text-base text-foreground font-medium">{user.name ?? "Not set"}</p>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Mail className="size-4" />
                  Email Address
                </label>
                <div className="rounded-lg border border-border/30 bg-secondary/30 px-4 py-3">
                  <p className="text-base text-foreground font-medium break-all">{user.email}</p>
                </div>
              </div>

              {/* Role */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Shield className="size-4" />
                  Role
                </label>
                <div className="rounded-lg border border-border/30 bg-secondary/30 px-4 py-3">
                  <p className="text-base text-foreground font-medium">
                    {user.role === "MANAGER" ? "Store Manager" : "Warehouse Employee"}
                  </p>
                </div>
              </div>

              {/* User ID */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">User ID</label>
                <div className="rounded-lg border border-border/30 bg-secondary/30 px-4 py-3">
                  <p className="text-xs font-mono text-muted-foreground break-all">{user.id}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Additional Info */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Session Info Card */}
            <Card className="border-border/50 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm p-4">
              <h3 className="font-bold text-foreground mb-3">Session Status</h3>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-sm text-muted-foreground">Active and logged in</span>
              </div>
            </Card>

            {/* Last Activity Card */}
            <Card className="border-border/50 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm p-4">
              <h3 className="flex items-center gap-2 font-bold text-foreground mb-3">
                <Calendar className="size-4" />
                Current Time
              </h3>
              <p className="text-sm text-muted-foreground">
                {format(new Date(), "PPpp")}
              </p>
            </Card>
          </div>

          {/* Notice */}
          <div className="mt-8 rounded-lg border border-warning/30 bg-warning/10 p-4">
            <p className="text-sm text-warning-foreground">
              To change your password or other account settings, please contact your administrator or use the account settings page (coming soon).
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}
