import Image from "next/image";
import { Button } from "@/components/ui/button";
import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <header className="w-full flex justify-between items-center">
        <h1 className="text-2xl font-bold">Levercast</h1>
        <div className="flex gap-2">
          <SignInButton mode="modal">
            <Button variant="outline">Sign In</Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button>Get Started</Button>
          </SignUpButton>
        </div>
      </header>

      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <div className="text-center sm:text-left">
          <h2 className="text-4xl font-bold mb-4">Convert Ideas into Social Posts</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Transform your spontaneous thoughts into polished, multi-platform content with AI.
          </p>
        </div>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <SignUpButton mode="modal">
            <Button size="lg">Start Creating</Button>
          </SignUpButton>
          <Button variant="outline" size="lg">Learn More</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mt-8">
          <div className="border rounded-lg p-6 text-center">
            <h3 className="font-semibold mb-2">Capture</h3>
            <p className="text-sm text-muted-foreground">Type or record your ideas</p>
          </div>
          <div className="border rounded-lg p-6 text-center">
            <h3 className="font-semibold mb-2">Process</h3>
            <p className="text-sm text-muted-foreground">AI optimizes for platforms</p>
          </div>
          <div className="border rounded-lg p-6 text-center">
            <h3 className="font-semibold mb-2">Publish</h3>
            <p className="text-sm text-muted-foreground">Share across social media</p>
          </div>
        </div>
      </main>

      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
