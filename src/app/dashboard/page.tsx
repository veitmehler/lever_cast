import { UserButton } from '@clerk/nextjs'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Levercast</h1>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Welcome to Levercast</h2>
          <p className="text-muted-foreground mb-8">
            Convert your spontaneous ideas into polished, multi-platform social posts.
          </p>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="border rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3">Idea Capture</h3>
              <p className="text-muted-foreground">
                Start by typing or recording your idea. Our AI will help transform it into engaging content.
              </p>
            </div>
            
            <div className="border rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3">AI Processing</h3>
              <p className="text-muted-foreground">
                Choose your preferred LLM provider and let AI optimize your content for different platforms.
              </p>
            </div>
            
            <div className="border rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3">Preview & Edit</h3>
              <p className="text-muted-foreground">
                Review and customize your posts with platform-specific previews before publishing.
              </p>
            </div>
            
            <div className="border rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3">Publish</h3>
              <p className="text-muted-foreground">
                Connect your social accounts and publish directly to LinkedIn, Twitter, and more.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
