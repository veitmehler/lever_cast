export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to Levercast</h1>
        <p className="text-muted-foreground">
          Convert your spontaneous ideas into polished, multi-platform social posts.
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-6 hover:border-primary/50 transition-colors">
          <h3 className="text-xl font-semibold text-card-foreground mb-3">Idea Capture</h3>
          <p className="text-muted-foreground">
            Start by typing or recording your idea. Our AI will help transform it into engaging content.
          </p>
        </div>
        
        <div className="rounded-lg border border-border bg-card p-6 hover:border-primary/50 transition-colors">
          <h3 className="text-xl font-semibold text-card-foreground mb-3">AI Processing</h3>
          <p className="text-muted-foreground">
            Choose your preferred LLM provider and let AI optimize your content for different platforms.
          </p>
        </div>
        
        <div className="rounded-lg border border-border bg-card p-6 hover:border-primary/50 transition-colors">
          <h3 className="text-xl font-semibold text-card-foreground mb-3">Preview & Edit</h3>
          <p className="text-muted-foreground">
            Review and customize your posts with platform-specific previews before publishing.
          </p>
        </div>
        
        <div className="rounded-lg border border-border bg-card p-6 hover:border-primary/50 transition-colors">
          <h3 className="text-xl font-semibold text-card-foreground mb-3">Publish</h3>
          <p className="text-muted-foreground">
            Connect your social accounts and publish directly to LinkedIn, Twitter, and more.
          </p>
        </div>
      </div>

      {/* Coming Soon Section */}
      <div className="mt-8 rounded-lg border border-border bg-card p-8 text-center">
        <h2 className="text-2xl font-bold text-card-foreground mb-2">
          Idea Capture Widget
        </h2>
        <p className="text-muted-foreground">
          Coming in Phase 2 - Text and voice input interface
        </p>
      </div>
    </div>
  )
}

