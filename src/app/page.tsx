"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { compile, decompile, encrypt, decrypt } from '@/lib/codecloak';
import { useToast } from "@/hooks/use-toast";
import { ArrowLeftRight, Code, LockKeyhole, UnlockKeyhole, Shuffle, Zap } from 'lucide-react';

export default function HomePage() {
  const [customHtml, setCustomHtml] = useState('');
  const [standardHtml, setStandardHtml] = useState('');
  const [encryptedText, setEncryptedText] = useState('');
  const { toast } = useToast();

  const handleCompile = () => {
    if (!customHtml.trim()) {
      toast({ title: "Input Missing", description: "Please enter custom HTML to compile.", variant: "destructive" });
      return;
    }
    const { result, error } = compile(customHtml);
    if (error) {
      toast({ title: "Compilation Error", description: error, variant: "destructive" });
      setStandardHtml('');
    } else if (result !== null) {
      setStandardHtml(result);
      toast({ title: "Success", description: "Custom HTML compiled to Standard HTML." });
    }
  };

  const handleDecompile = () => {
    if (!standardHtml.trim()) {
      toast({ title: "Input Missing", description: "Please enter standard HTML to decompile.", variant: "destructive" });
      return;
    }
    const result = decompile(standardHtml);
    setCustomHtml(result);
    toast({ title: "Success", description: "Standard HTML decompiled to Custom HTML." });
  };

  const handleEncrypt = () => {
    if (!customHtml.trim()) {
      toast({ title: "Input Missing", description: "Please enter custom HTML to encrypt.", variant: "destructive" });
      return;
    }
    const result = encrypt(customHtml);
    setEncryptedText(result);
    toast({ title: "Success", description: "Custom HTML encrypted." });
  };

  const handleDecrypt = () => {
    if (!encryptedText.trim()) {
      toast({ title: "Input Missing", description: "Please enter encrypted text to decrypt.", variant: "destructive" });
      return;
    }
    const result = decrypt(encryptedText);
    setCustomHtml(result); // Decrypted text goes back to custom HTML area
    toast({ title: "Success", description: "Text decrypted to Custom HTML." });
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-8 bg-background">
      <header className="mb-8 text-center">
        <h1 className="text-5xl font-bold text-primary flex items-center justify-center">
          <Zap className="w-12 h-12 mr-3 text-accent" />
          Codecloak
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Transform, secure, and manage your code snippets with ease.
        </p>
      </header>

      <main className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Custom HTML Input and its direct transformations */}
        <div className="flex flex-col gap-6">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Shuffle className="w-6 h-6 mr-2 text-primary" />
                Custom HTML-like Syntax
              </CardTitle>
              <CardDescription>Enter your custom syntax code here (e.g., #div$ #p$Hello#/p$ #/div$).</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={customHtml}
                onChange={(e) => setCustomHtml(e.target.value)}
                placeholder={`#div class="container"$\n  #h1$Welcome to Codecloak!#/h1$\n  #p$Start typing your custom code...#/p$\n#/div$`}
                className="h-60 resize-none bg-input border-border focus:ring-accent"
                aria-label="Custom HTML-like Syntax Input"
              />
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-2 justify-end">
              <Button onClick={handleCompile} variant="outline" className="w-full sm:w-auto group hover:bg-accent hover:text-accent-foreground transition-colors">
                <Code className="w-5 h-5 mr-2 group-hover:animate-pulse" /> Compile to HTML
              </Button>
              <Button onClick={handleEncrypt} variant="outline" className="w-full sm:w-auto group hover:bg-accent hover:text-accent-foreground transition-colors">
                <LockKeyhole className="w-5 h-5 mr-2 group-hover:animate-pulse" /> Encrypt Code
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Right Column: Standard HTML and Encrypted Text areas */}
        <div className="flex flex-col gap-6">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Code className="w-6 h-6 mr-2 text-primary" />
                Standard HTML
              </CardTitle>
              <CardDescription>View compiled HTML or input HTML to decompile.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={standardHtml}
                onChange={(e) => setStandardHtml(e.target.value)}
                placeholder={`<div class="container">\n  <h1>Welcome to Codecloak!</h1>\n  <p>Start typing your custom code...</p>\n</div>`}
                className="h-40 resize-none bg-input border-border focus:ring-accent"
                aria-label="Standard HTML Output/Input"
              />
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleDecompile} variant="outline" className="group hover:bg-accent hover:text-accent-foreground transition-colors">
                <ArrowLeftRight className="w-5 h-5 mr-2 group-hover:animate-pulse" /> Decompile to Custom
              </Button>
            </CardFooter>
          </Card>

          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <LockKeyhole className="w-6 h-6 mr-2 text-primary" />
                Encrypted / Decrypted Zone
              </CardTitle>
              <CardDescription>View encrypted code or input code to decrypt.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={encryptedText}
                onChange={(e) => setEncryptedText(e.target.value)}
                placeholder="Encrypted text will appear here..."
                className="h-40 resize-none bg-input border-border focus:ring-accent"
                aria-label="Encrypted/Decrypted Text Output/Input"
              />
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleDecrypt} variant="outline" className="group hover:bg-accent hover:text-accent-foreground transition-colors">
                <UnlockKeyhole className="w-5 h-5 mr-2 group-hover:animate-pulse" /> Decrypt Code
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Codecloak. All rights reserved.</p>
        <p>Secure your snippets with a touch of magic.</p>
      </footer>
    </div>
  );
}
