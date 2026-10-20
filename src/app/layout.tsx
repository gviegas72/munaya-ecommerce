import type { Metadata } from "next";
import { Oswald, Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Navbar } from "@/components/Navbar";

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Munaya | A Arte do Caos",
  description: "Munaya reinventa a arte de se vestir com o rock. Irreverente, pesado e focado no lifestyle.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${oswald.variable} ${inter.variable} antialiased`}
      suppressHydrationWarning
    >
      <body className="font-sans min-h-screen flex flex-col md:flex-row bg-background text-foreground transition-colors duration-300">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <Navbar />
          <main className="flex-1 w-full md:ml-[max(15%,200px)] relative">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
