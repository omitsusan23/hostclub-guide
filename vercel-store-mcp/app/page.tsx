export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-2xl mx-auto text-center p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🏪 Store Management MCP Server
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          店舗作成とサブドメイン自動構築のためのMCPサーバーです
        </p>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">🔧 利用可能なツール</h2>
          <div className="space-y-4 text-left">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-medium text-gray-900">create_store_with_subdomain</h3>
              <p className="text-gray-600">新規店舗を作成し、自動的にサブドメインをセットアップします</p>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-medium text-gray-900">check_subdomain_status</h3>
              <p className="text-gray-600">指定したサブドメインの状況を確認します</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-2">📡 MCP Endpoint</h2>
          <code className="text-blue-700 bg-blue-100 px-3 py-1 rounded">
            /api/mcp
          </code>
          <p className="text-blue-700 mt-2 text-sm">
            このエンドポイントをCursorやClaudeなどのMCPクライアントに追加してください
          </p>
        </div>
      </div>
    </div>
  )
} 