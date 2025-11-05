'use client'

import { UserButton, useUser } from '@clerk/nextjs'

export function ProtectedHeader() {
  const { isLoaded, user } = useUser()

  if (!isLoaded) {
    return (
      <header className="flex h-16 items-center justify-end border-b border-border bg-background px-6 gap-4">
        <span className="text-sm text-muted-foreground">Loading...</span>
      </header>
    )
  }

  return (
    <header className="flex h-16 items-center justify-end border-b border-border bg-background px-6 gap-4">
      <span className="text-sm text-muted-foreground">
        {user?.firstName || user?.emailAddresses?.[0]?.emailAddress}
      </span>
      <UserButton 
        appearance={{
          elements: {
            avatarBox: "w-10 h-10"
          }
        }}
      />
    </header>
  )
}

