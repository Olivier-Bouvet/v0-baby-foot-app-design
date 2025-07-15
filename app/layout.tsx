import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "MyLegiFoot Tracker",
  description: "Enregistrez vos matchs de baby-foot et suivez vos performances",
  generator: "v0.dev",
  manifest: "/manifest.json",
  keywords: ["baby-foot", "football de table", "tracker", "scores", "statistiques"],
  authors: [{ name: "MyLegiFoot" }],
  icons: {
    icon: "/app-icon.png",
    shortcut: "/app-icon.png",
    apple: "/app-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <head>
        {/* PWA Meta Tags */}
        <meta name="application-name" content="MyLegiFoot Tracker" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MyLegiFoot" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#1e40af" />

        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/app-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/app-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/app-icon.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/app-icon.png" />

        {/* Android Icons */}
        <link rel="icon" type="image/png" sizes="192x192" href="/app-icon.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/app-icon.png" />

        {/* Favicon */}
        <link rel="icon" href="/app-icon.png" />
        <link rel="shortcut icon" href="/app-icon.png" />
      </head>
      <body>{children}</body>
    </html>
  )
}
