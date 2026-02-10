import { rubik } from "@/lib/fonts";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ProgressBarProvider } from "@/components/providers/progress-bar-provider";
import { ReactQueryProvider } from "@/components/providers/react-query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { DirectionProvider } from "@/components/ui/direction";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { appConfig } from "@/config/app";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: appConfig.name,
  description: appConfig.description,
  icons: {
    icon: appConfig.icons.icon,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className="no-scrollbar overscroll-none"
      dir="rtl"
      lang="he"
      suppressHydrationWarning
    >
      <body
        className={cn("no-scrollbar overscroll-none", rubik.className)}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
          enableColorScheme
          enableSystem
        >
          <TooltipProvider delayDuration={0}>
            <NuqsAdapter>
              <ProgressBarProvider>
                <ReactQueryProvider>
                  <DirectionProvider dir={"rtl"} direction="rtl">
                    {children}
                  </DirectionProvider>
                </ReactQueryProvider>
              </ProgressBarProvider>
            </NuqsAdapter>
          </TooltipProvider>
        </ThemeProvider>
        <Toaster dir={"rtl"} position={"top-center"} richColors />
        <Analytics />
      </body>
    </html>
  );
}
