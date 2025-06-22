import './globals.css'

export const metadata = {
  title: 'Store Management MCP Server',
  description: 'MCP server for automated store subdomain creation on Vercel',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className="bg-gray-50">
        {children}
      </body>
    </html>
  )
} 