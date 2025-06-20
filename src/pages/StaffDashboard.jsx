import React from 'react'
import Layout from '../components/Layout'

const StaffDashboard = () => {
  return (
    <Layout>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: '#2c3e50', marginBottom: '1rem' }}>
          スタッフダッシュボード
        </h2>
        <p style={{ color: '#6c757d' }}>
          案内所スタッフとして、案内登録と店舗確認業務を行うことができます。
        </p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '2rem' 
      }}>
        {/* 案内登録 */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem', color: '#2c3e50' }}>
            案内登録
          </h3>
          <p style={{ marginBottom: '1rem', color: '#6c757d' }}>
            お客様をホストクラブに案内する登録業務を行います。
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary">新規案内登録</button>
            <button className="btn btn-secondary">案内履歴</button>
          </div>
        </div>

        {/* 店舗確認 */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem', color: '#2c3e50' }}>
            店舗確認
          </h3>
          <p style={{ marginBottom: '1rem', color: '#6c757d' }}>
            登録済み店舗の営業状況や空席状況を確認します。
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary">店舗状況確認</button>
            <button className="btn btn-secondary">営業日確認</button>
          </div>
        </div>

        {/* 顧客管理 */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem', color: '#2c3e50' }}>
            顧客管理
          </h3>
          <p style={{ marginBottom: '1rem', color: '#6c757d' }}>
            案内したお客様の情報管理を行います。
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary">顧客一覧</button>
            <button className="btn btn-secondary">案内実績</button>
          </div>
        </div>

        {/* 本日の案内予定 */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem', color: '#2c3e50' }}>
            本日の案内予定
          </h3>
          <p style={{ marginBottom: '1rem', color: '#6c757d' }}>
            今日予定されている案内業務を確認します。
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary">今日の予定</button>
            <button className="btn btn-secondary">週間予定</button>
          </div>
        </div>
      </div>

      {/* 今日の実績 */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', color: '#2c3e50' }}>
          今日の実績
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: '1rem' 
        }}>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#007bff' }}>8</div>
            <div style={{ color: '#6c757d' }}>案内件数</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745' }}>5</div>
            <div style={{ color: '#6c757d' }}>成約件数</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffc107' }}>3</div>
            <div style={{ color: '#6c757d' }}>確認待ち</div>
          </div>
        </div>
      </div>

      {/* 最近の案内履歴 */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', color: '#2c3e50' }}>
          最近の案内履歴
        </h3>
        <div style={{ color: '#6c757d' }}>
          <p>• 14:30 - 田中様をクラブロイヤルに案内（成約）</p>
          <p>• 13:15 - 佐藤様をクラブエースに案内（確認中）</p>
          <p>• 12:00 - 山田様をクラブキングに案内（成約）</p>
        </div>
      </div>
    </Layout>
  )
}

export default StaffDashboard 