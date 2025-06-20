import React from 'react'
import Layout from '../components/Layout'
import { useApp } from '../contexts/AppContext'

const CustomerDashboard = () => {
  const { getUserStoreId } = useApp()
  const storeId = getUserStoreId()

  return (
    <Layout>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: '#2c3e50', marginBottom: '1rem' }}>
          店舗管理ダッシュボード
        </h2>
        <p style={{ color: '#6c757d' }}>
          ホストクラブの担当者として、自店舗の営業日設定や請求確認を行うことができます。
          {storeId && <span>（店舗ID: {storeId}）</span>}
        </p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '2rem' 
      }}>
        {/* 営業日設定 */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem', color: '#2c3e50' }}>
            営業日設定
          </h3>
          <p style={{ marginBottom: '1rem', color: '#6c757d' }}>
            店舗の営業日や営業時間、特別な営業状況を設定します。
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary">営業日設定</button>
            <button className="btn btn-secondary">営業カレンダー</button>
          </div>
        </div>

        {/* 請求確認 */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem', color: '#2c3e50' }}>
            請求確認
          </h3>
          <p style={{ marginBottom: '1rem', color: '#6c757d' }}>
            案内所への支払いや請求書の確認を行います。
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary">今月の請求</button>
            <button className="btn btn-secondary">請求履歴</button>
          </div>
        </div>

        {/* 店舗情報更新 */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem', color: '#2c3e50' }}>
            店舗情報更新
          </h3>
          <p style={{ marginBottom: '1rem', color: '#6c757d' }}>
            店舗の基本情報や連絡先情報を更新します。
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary">店舗情報編集</button>
            <button className="btn btn-secondary">プロフィール確認</button>
          </div>
        </div>

        {/* 案内実績確認 */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem', color: '#2c3e50' }}>
            案内実績確認
          </h3>
          <p style={{ marginBottom: '1rem', color: '#6c757d' }}>
            自店舗への案内実績や成約状況を確認します。
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary">今月の実績</button>
            <button className="btn btn-secondary">年間実績</button>
          </div>
        </div>
      </div>

      {/* 今月の実績サマリー */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', color: '#2c3e50' }}>
          今月の実績サマリー
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: '1rem' 
        }}>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#007bff' }}>24</div>
            <div style={{ color: '#6c757d' }}>案内件数</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745' }}>18</div>
            <div style={{ color: '#6c757d' }}>成約件数</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffc107' }}>75%</div>
            <div style={{ color: '#6c757d' }}>成約率</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc3545' }}>¥180,000</div>
            <div style={{ color: '#6c757d' }}>今月の請求額</div>
          </div>
        </div>
      </div>

      {/* 営業状況 */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', color: '#2c3e50' }}>
          現在の営業状況
        </h3>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem',
          padding: '1rem',
          backgroundColor: '#d4edda',
          borderRadius: '8px',
          border: '1px solid #c3e6cb'
        }}>
          <div style={{ 
            width: '12px', 
            height: '12px', 
            backgroundColor: '#28a745', 
            borderRadius: '50%' 
          }}></div>
          <div>
            <strong style={{ color: '#155724' }}>営業中</strong>
            <div style={{ fontSize: '0.9rem', color: '#155724' }}>
              本日 18:00 - 03:00 | 空席あり
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default CustomerDashboard 