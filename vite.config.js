// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  build: {
    // チャンクサイズ警告の閾値を上げる（PDFライブラリが大きいため）
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // 手動でチャンクを分割
        manualChunks: {
          // PDFライブラリを別チャンクに
          'pdf-libs': ['jspdf', 'html2canvas', 'html2pdf.js'],
          // Supabaseを別チャンクに
          'supabase': ['@supabase/supabase-js'],
          // React関連を別チャンクに
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        },
        // アセット名のカスタマイズ
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css')
            return 'assets/styles/[name]-[hash][extname]'
          return 'assets/[name]-[hash][extname]'
        },
        // チャンクファイル名のカスタマイズ
        chunkFileNames: 'assets/js/[name]-[hash].js',
        // エントリーファイル名のカスタマイズ
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
    // ソースマップを本番環境では無効化（ビルドサイズ削減）
    sourcemap: false,
    // Terserによる圧縮設定
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 本番環境でconsole.logを削除
        drop_debugger: true, // debuggerステートメントを削除
      },
    },
  },
  // 開発サーバーの設定
  server: {
    port: 5173,
    strictPort: false,
    open: false,
  },
  // プレビューサーバーの設定
  preview: {
    port: 4173,
    strictPort: false,
  },
})
