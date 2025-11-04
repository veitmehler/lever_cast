'use client'

import { Mail, Calendar, Shield } from 'lucide-react'

// Mock user data
const mockUser = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  joinedDate: '2024-10-15',
  plan: 'Free',
  postsCreated: 12,
  postsPublished: 8
}

export default function AccountPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Account</h1>
        <p className="text-muted-foreground">
          Manage your account information and preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Section */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-card-foreground mb-6">Profile</h2>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-lg font-bold">
                {mockUser.name.charAt(0)}
              </div>
              <div>
                <div className="font-medium text-card-foreground">{mockUser.name}</div>
                <div className="text-sm text-muted-foreground">Free Plan</div>
              </div>
            </div>

            <div className="grid gap-4 pt-4 border-t border-border">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Email</div>
                  <div className="text-card-foreground">{mockUser.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Member Since</div>
                  <div className="text-card-foreground">
                    {new Date(mockUser.joinedDate).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Account Security</div>
                  <div className="text-card-foreground">Managed by Clerk</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Stats */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-card-foreground mb-4">Usage Statistics</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-secondary p-4">
              <div className="text-3xl font-bold text-foreground mb-1">
                {mockUser.postsCreated}
              </div>
              <div className="text-sm text-muted-foreground">Posts Created</div>
            </div>

            <div className="rounded-lg bg-secondary p-4">
              <div className="text-3xl font-bold text-foreground mb-1">
                {mockUser.postsPublished}
              </div>
              <div className="text-sm text-muted-foreground">Posts Published</div>
            </div>
          </div>
        </div>

        {/* Subscription Info */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-card-foreground mb-4">Subscription</h2>
          
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary">
            <div>
              <div className="font-medium text-card-foreground mb-1">Free Plan</div>
              <div className="text-sm text-muted-foreground">
                Limited features • Upgrade for unlimited access
              </div>
            </div>
            <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
              Upgrade
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

