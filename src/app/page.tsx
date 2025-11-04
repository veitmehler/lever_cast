import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Sparkles, Mic, Zap, Share2, CheckCircle } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Levercast</h1>
          </div>
          <Link href="/dashboard">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              Try Demo
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/10 text-sm font-medium text-foreground mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>AI-Powered Content Creation</span>
          </div>
          
          <h2 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Turn Ideas into
            <span className="block text-primary">Social Posts</span>
          </h2>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Transform spontaneous thoughts into polished, platform-optimized content. 
            Type or speak—AI does the rest.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/dashboard">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-6">
                <Sparkles className="w-5 h-5 mr-2" />
                Start Creating Free
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20 bg-secondary/30 rounded-3xl my-20">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Everything you need to amplify your voice
          </h3>
          <p className="text-muted-foreground text-center mb-16 text-lg">
            From idea to published post in seconds
          </p>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="bg-card border border-border rounded-2xl p-8 hover:border-primary/50 transition-all hover:shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Mic className="w-6 h-6 text-primary" />
              </div>
              <h4 className="text-xl font-semibold mb-3">Voice & Text Capture</h4>
              <p className="text-muted-foreground">
                Type or record your thoughts. Never lose an idea—capture inspiration the moment it strikes.
              </p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-8 hover:border-primary/50 transition-all hover:shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h4 className="text-xl font-semibold mb-3">AI Optimization</h4>
              <p className="text-muted-foreground">
                Our AI crafts platform-specific posts optimized for LinkedIn, Twitter, and more. Professional quality, instantly.
              </p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-8 hover:border-primary/50 transition-all hover:shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Share2 className="w-6 h-6 text-primary" />
              </div>
              <h4 className="text-xl font-semibold mb-3">Multi-Platform Publishing</h4>
              <p className="text-muted-foreground">
                Preview, edit, and publish to multiple platforms with one click. Save hours every week.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Why creators love Levercast
          </h3>

          <div className="space-y-6">
            {[
              "Generate LinkedIn and Twitter posts in seconds",
              "Maintain your authentic voice with AI assistance",
              "Edit and customize before publishing",
              "Never lose a great idea with voice capture",
              "Platform-specific formatting automatically applied",
              "Save drafts and publish when ready"
            ].map((benefit, i) => (
              <div key={i} className="flex items-start gap-4">
                <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <p className="text-lg text-foreground">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl p-12 md:p-20 border border-primary/20">
          <h3 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to amplify your content?
          </h3>
          <p className="text-xl text-muted-foreground mb-8">
            Join entrepreneurs turning ideas into engagement
          </p>
          <Link href="/dashboard">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-6">
              <Sparkles className="w-5 h-5 mr-2" />
              Try Levercast Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">Levercast</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Levercast. Design Mode Prototype.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
