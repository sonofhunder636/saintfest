import type { Metadata } from "next";
import { Cormorant, Sorts_Mill_Goudy, League_Spartan, Dancing_Script } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import AdminAutoLogoutHandler from "@/components/AdminAutoLogoutHandler";

const cormorant = Cormorant({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const sortsMill = Sorts_Mill_Goudy({
  variable: "--font-sorts-mill",
  subsets: ["latin"],
  weight: ["400"],
});

const leagueSpartan = League_Spartan({
  variable: "--font-league-spartan",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const dancingScript = Dancing_Script({
  variable: "--font-dancing-script",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Saintfest",
  description: "A celebration of saints through community voting",
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 5.0,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${cormorant.variable} ${sortsMill.variable} ${leagueSpartan.variable} ${dancingScript.variable} antialiased`}
      >
        <AuthProvider>
          <AdminAuthProvider>
            <AdminAutoLogoutHandler />
            {children}
          </AdminAuthProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
