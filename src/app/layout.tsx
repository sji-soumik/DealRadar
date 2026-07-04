import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DealRadar — Pipeline Health & Forecast Agent",
  description:
    "Autonomous pipeline-health and forecast-integrity agent: explainable risk scoring, next-best actions, and a risk-adjusted forecast.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
