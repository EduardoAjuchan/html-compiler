
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { compile, decompile, encrypt, decrypt } from '@/lib';
import { useToast } from "@/hooks/use-toast";
import { ArrowLeftRight, Code, LockKeyhole, UnlockKeyhole, Shuffle } from 'lucide-react';

export default function HomePage() {
  const [customHtml, setCustomHtml] = useState('');
  const [standardHtml, setStandardHtml] = useState('');
  const [encryptedText, setEncryptedText] = useState('');
  const { toast } = useToast();

  const handleCompile = () => {
    if (!customHtml.trim()) {
      toast({ title: "Entrada Faltante", description: "Por favor, ingresa HTML personalizado para compilar.", variant: "destructive" });
      return;
    }
    const { result, error } = compile(customHtml);
    if (error) {
      toast({ title: "Error de Compilación", description: error, variant: "destructive" });
      setStandardHtml('');
    } else if (result !== null) {
      setStandardHtml(result);
      toast({ title: "Éxito", description: "HTML personalizado compilado a HTML Estándar." });
    }
  };

  const handleDecompile = () => {
    if (!standardHtml.trim()) {
      toast({ title: "Entrada Faltante", description: "Por favor, ingresa HTML estándar para decompilar.", variant: "destructive" });
      return;
    }
    const result = decompile(standardHtml);
    setCustomHtml(result);
    toast({ title: "Éxito", description: "HTML estándar decompilado a HTML Personalizado." });
  };

  const handleEncrypt = () => {
    if (!customHtml.trim()) {
      toast({ title: "Entrada Faltante", description: "Por favor, ingresa HTML personalizado para encriptar.", variant: "destructive" });
      return;
    }
    const result = encrypt(customHtml);
    setEncryptedText(result);
    toast({ title: "Éxito", description: "HTML personalizado encriptado." });
  };

  const handleDecrypt = () => {
    if (!encryptedText.trim()) {
      toast({ title: "Entrada Faltante", description: "Por favor, ingresa texto encriptado para desencriptar.", variant: "destructive" });
      return;
    }
    const result = decrypt(encryptedText);
    setCustomHtml(result);
    toast({ title: "Éxito", description: "Texto desencriptado a HTML Personalizado." });
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-8 bg-background">
      <main className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="flex flex-col gap-6">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Shuffle className="w-6 h-6 mr-2 text-primary" />
                Sintaxis Personalizada tipo HTML
              </CardTitle>
              <CardDescription>Ingresa tu código de sintaxis personalizada aquí (ej., #div$ #p$Hola#/p$ #/div$).</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={customHtml}
                onChange={(e) => setCustomHtml(e.target.value)}
                placeholder={`#div class="container"$\n  #h1$¡Bienvenido!#/h1$\n  #p$Comienza a escribir tu código personalizado...#/p$\n#/div$`}
                className="h-60 resize-none bg-input border-border focus:ring-ring font-mono"
                aria-label="Entrada de Sintaxis Personalizada tipo HTML"
              />
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-2 justify-end">
              <Button onClick={handleCompile} variant="default" className="w-full sm:w-auto group transition-colors">
                <Code className="w-5 h-5 mr-2 group-hover:animate-pulse" /> Compilar a HTML
              </Button>
              <Button onClick={handleEncrypt} variant="default" className="w-full sm:w-auto group transition-colors">
                <LockKeyhole className="w-5 h-5 mr-2 group-hover:animate-pulse" /> Encriptar Código
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Code className="w-6 h-6 mr-2 text-primary" />
                HTML Estándar
              </CardTitle>
              <CardDescription>Visualiza HTML compilado o ingresa HTML para decompilar.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={standardHtml}
                onChange={(e) => setStandardHtml(e.target.value)}
                placeholder={`<div class="container">\n  <h1>¡Bienvenido!</h1>\n  <p>Comienza a escribir tu código personalizado...</p>\n</div>`}
                className="h-40 resize-none bg-input border-border focus:ring-ring font-mono"
                aria-label="Salida/Entrada de HTML Estándar"
              />
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleDecompile} variant="default" className="group transition-colors">
                <ArrowLeftRight className="w-5 h-5 mr-2 group-hover:animate-pulse" /> Decompilar a Personalizado
              </Button>
            </CardFooter>
          </Card>

          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <LockKeyhole className="w-6 h-6 mr-2 text-primary" />
                Zona Encriptada / Desencriptada
              </CardTitle>
              <CardDescription>Visualiza código encriptado o ingresa código para desencriptar.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={encryptedText}
                onChange={(e) => setEncryptedText(e.target.value)}
                placeholder="El texto encriptado aparecerá aquí..."
                className="h-40 resize-none bg-input border-border focus:ring-ring font-mono"
                aria-label="Salida/Entrada de Texto Encriptado/Desencriptado"
              />
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleDecrypt} variant="default" className="group transition-colors">
                <UnlockKeyhole className="w-5 h-5 mr-2 group-hover:animate-pulse" /> Desencriptar Código
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
      <footer className="mt-12 text-center text-sm text-muted-foreground">
      </footer>
    </div>
  );
}
