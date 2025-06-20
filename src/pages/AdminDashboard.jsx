import React from 'react'
import Layout from '../components/Layout'

const AdminDashboard = () => {
  return (
    <Layout>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: '#2c3e50', marginBottom: '1rem' }}>
          管理者ダッシュボード
        </h2>
        <p style={{ color: '#6c757d' }}>
          案内所運営責任者として、全店舗の管理と新規契約を行うことができます。
        </p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '2rem' 
      }}>
        {/* 店舗管理 */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem', color: '#2c3e50' }}>
            店舗管理
          </h3>
          <p style={{ marginBottom: '1rem', color: '#6c757d' }}>
            登録されている全ホストクラブの管理を行います。
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary">店舗一覧</button>
            <button className="btn btn-secondary">店舗追加</button>
          </div>
        </div>

        {/* 新規契約 */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem', color: '#2c3e50' }}>
            新規契約
          </h3>
          <p style={{ marginBottom: '1rem', color: '#6c757d' }}>
            新しいホストクラブとの契約手続きを行います。
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary">契約申込み</button>
            <button className="btn btn-secondary">契約一覧</button>
          </div>
        </div>

        {/* システム設定 */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem', color: '#2c3e50' }}>
            システム設定
          </h3>
          <p style={{ marginBottom: '1rem', color: '#6c757d' }}>
            システム全体の設定と管理を行います。
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary">ユーザー管理</button>
            <button className="btn btn-secondary">システム設定</button>
          </div>
        </div>

        {/* 統計・レポート */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem', color: '#2c3e50' }}>
            統計・レポート
          </h3>
          <p style={{ marginBottom: '1rem', color: '#6c757d' }}>
            案内所全体の統計情報とレポートを確認します。
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary">月次レポート</button>
            <button className="btn btn-secondary">売上統計</button>
          </div>
        </div>
      </div>

      {/* 最近の活動 */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', color: '#2c3e50' }}>
          最近の活動
        </h3>
        <div style={{ color: '#6c757d' }}>
          <p>• 新規店舗「クラブエース」の契約が完了しました</p>
          <p>• スタッフ田中さんが案内登録を15件完了しました</p>
          <p>• システムメンテナンスが正常に完了しました</p>
        </div>
      </div>
    </Layout>
  )
}

export default AdminDashboard 