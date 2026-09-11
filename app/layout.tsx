import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "ECOJOI · Studio 3D", description: "Crie amostras virtuais dos seus produtos e apresente suas artes em 3D.", icons: { icon: "/favicon.svg" } };
export default function RootLayout({children}: {children: React.ReactNode}) { return <html lang="pt-BR"><body>{children}</body></html>; }
