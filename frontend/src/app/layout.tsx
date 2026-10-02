import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Estrutec",
  description:
    "Sistema de Orçamentação e Planejamento de Estruturas Pré-Moldadas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}