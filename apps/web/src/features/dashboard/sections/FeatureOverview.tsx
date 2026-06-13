export function FeatureOverview() {
  return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-6 hover:border-primary/50 transition-colors">
            <h3 className="text-xl font-semibold text-card-foreground mb-3">Idea Capture</h3>
            <p className="text-muted-foreground">
              Type or record your idea above. Our AI will transform it into engaging content.
            </p>
          </div>
          
          <div className="rounded-lg border border-border bg-card p-6 hover:border-primary/50 transition-colors">
            <h3 className="text-xl font-semibold text-card-foreground mb-3">AI Processing</h3>
            <p className="text-muted-foreground">
              Choose your target platform and let AI optimize your content automatically.
            </p>
          </div>
          
          <div className="rounded-lg border border-border bg-card p-6 hover:border-primary/50 transition-colors">
            <h3 className="text-xl font-semibold text-card-foreground mb-3">Preview & Edit</h3>
            <p className="text-muted-foreground">
              Review generated posts with platform-specific previews. Click to edit inline.
            </p>
          </div>
          
          <div className="rounded-lg border border-border bg-card p-6 hover:border-primary/50 transition-colors">
            <h3 className="text-xl font-semibold text-card-foreground mb-3">Publish</h3>
            <p className="text-muted-foreground">
              Copy to clipboard or publish directly to your connected social accounts.
            </p>
          </div>
        </div>
  )
}
