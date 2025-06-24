import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import StaffEditModal from '../components/StaffEditModal'
import { useApp } from '../contexts/AppContext'
import { addNewStaff, getAllStaffs, generateStaffId, checkStaffIdExists, updateStaff, deleteStaff } from '../utils/staffManagement.js'

const StaffManagementPage = () => {
  const { hasAdminPermissions } = useApp()
  const [showStaffModal, setShowStaffModal] = useState(false)
  const [staffs, setStaffs] = useState([])
  const [loadingStaffs, setLoadingStaffs] = useState(true)
  const [newStaff, setNewStaff] = useState({
    staff_id: '',
    display_name: '',
    password: 'ryota123',
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [showStaffEditModal, setShowStaffEditModal] = useState(false)

  // 権限チェック
  if (!hasAdminPermissions()) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            <h2 className="text-lg font-semibold mb-2">アクセス権限がありません</h2>
            <p>このページは管理者のみアクセスできます。</p>
          </div>
        </div>
      </Layout>
    )
  }

  // スタッフデータを取得
  useEffect(() => {
    loadStaffs()
  }, [])

  const loadStaffs = async () => {
    setLoadingStaffs(true)
    try {
      const result = await getAllStaffs()
      if (result.success) {
        setStaffs(result.data)
      } else {
        console.error('Failed to load staffs:', result.error)
        setMessage('スタッフデータの読み込みに失敗しました')
        setMessageType('error')
      }
    } catch (error) {
      console.error('Error loading staffs:', error)
      setMessage('スタッフデータの読み込み中にエラーが発生しました')
      setMessageType('error')
    } finally {
      setLoadingStaffs(false)
    }
  }

  const handleAddStaff = async () => {
    if (!newStaff.staff_id || !newStaff.display_name) {
      setMessage('スタッフIDと表示名は必須です')
      setMessageType('error')
      return
    }

    setLoading(true)
    setMessage('')
    
    try {
      const exists = await checkStaffIdExists(newStaff.staff_id)
      if (exists) {
        setMessage('このスタッフIDは既に使用されています')
        setMessageType('error')
        return
      }

      const result = await addNewStaff(newStaff)
      
      if (result.success) {
        setMessage(result.message || `✅ ${newStaff.display_name} を追加しました！`)
        setMessageType('success')
        
        setNewStaff({
          staff_id: '',
          display_name: '',
          password: 'ryota123',
          notes: ''
        })
        
        loadStaffs()
        
        setTimeout(() => {
          setShowStaffModal(false)
          setMessage('')
          setMessageType('')
        }, 3000)
        
      } else {
        setMessage(`❌ エラー: ${result.error}`)
        setMessageType('error')
      }
      
    } catch (error) {
      console.error('Staff addition error:', error)
      setMessage('❌ スタッフ追加中に予期しないエラーが発生しました')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const handleDisplayNameChange = (displayName) => {
    setNewStaff({
      ...newStaff, 
      display_name: displayName,
      staff_id: newStaff.staff_id || generateStaffId(displayName)
    })
  }

  const handleEditStaff = (staff) => {
    setSelectedStaff(staff)
    setShowStaffEditModal(true)
  }

  const handleCloseStaffEdit = () => {
    setSelectedStaff(null)
    setShowStaffEditModal(false)
  }

  const handleUpdateStaff = async (formData) => {
    if (!selectedStaff) {
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const result = await updateStaff(selectedStaff.id, formData)
      
      if (result.success) {
        setMessage(result.message || `✅ ${formData.display_name} を更新しました！`)
        setMessageType('success')
        
        loadStaffs()
        
        setTimeout(() => {
          setShowStaffEditModal(false)
          setSelectedStaff(null)
          setMessage('')
          setMessageType('')
        }, 2000)
        
      } else {
        setMessage(`❌ エラー: ${result.error}`)
        setMessageType('error')
      }
      
    } catch (error) {
      console.error('Staff update error:', error)
      setMessage('❌ スタッフ更新中に予期しないエラーが発生しました')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteStaff = async (staffId) => {
    if (!staffId) {
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const result = await deleteStaff(staffId)
      
      if (result.success) {
        setMessage(result.message || `✅ スタッフを削除しました`)
        setMessageType('success')
        
        loadStaffs()
        
        setTimeout(() => {
          setShowStaffEditModal(false)
          setSelectedStaff(null)
          setMessage('')
          setMessageType('')
        }, 2000)
        
      } else {
        setMessage(`❌ エラー: ${result.error}`)
        setMessageType('error')
      }
      
    } catch (error) {
      console.error('Staff delete error:', error)
      setMessage('❌ スタッフ削除中に予期しないエラーが発生しました')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6">
        {/* ヘッダー */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            👥 スタッフ管理
          </h2>
          <p className="text-gray-600">
            スタッフの登録・編集・削除を管理できます。
          </p>
        </div>

        {/* メッセージ表示 */}
        {message && (
          <div className={`mb-4 p-4 rounded-lg ${
            messageType === 'success' ? 'bg-green-50 text-green-800' :
            messageType === 'error' ? 'bg-red-50 text-red-800' :
            'bg-yellow-50 text-yellow-800'
          }`}>
            {message}
          </div>
        )}

        {/* 新規スタッフ追加ボタン */}
        <div className="mb-6">
          <button
            onClick={() => setShowStaffModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            ➕ 新規スタッフ追加
          </button>
        </div>

        {/* スタッフ一覧 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            登録スタッフ一覧 ({staffs.length}名)
          </h3>
          
          {loadingStaffs ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">スタッフデータを読み込み中...</p>
            </div>
          ) : staffs.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              登録されているスタッフがいません
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {staffs.map((staff) => (
                <div
                  key={staff.id}
                  onClick={() => handleEditStaff(staff)}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <h4 className="font-medium text-gray-900 mb-2">{staff.display_name}</h4>
                  <p className="text-sm text-gray-600 mb-1">ID: {staff.staff_id}</p>
                  <p className="text-sm text-gray-600 mb-1">
                    登録日: {new Date(staff.created_at).toLocaleDateString('ja-JP')}
                  </p>
                  {staff.notes && (
                    <p className="text-sm text-gray-600 truncate">
                      備考: {staff.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 新規スタッフ追加モーダル */}
        <Modal isOpen={showStaffModal} onClose={() => setShowStaffModal(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">新規スタッフ追加</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  表示名 *
                </label>
                <input
                  type="text"
                  value={newStaff.display_name}
                  onChange={(e) => handleDisplayNameChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="表示名を入力"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  スタッフID *
                </label>
                <input
                  type="text"
                  value={newStaff.staff_id}
                  onChange={(e) => setNewStaff({...newStaff, staff_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="スタッフIDを入力"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  パスワード
                </label>
                <input
                  type="text"
                  value={newStaff.password}
                  onChange={(e) => setNewStaff({...newStaff, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="パスワードを入力"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  備考
                </label>
                <textarea
                  value={newStaff.notes}
                  onChange={(e) => setNewStaff({...newStaff, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="備考を入力"
                  rows="3"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowStaffModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                キャンセル
              </button>
              <button
                onClick={handleAddStaff}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? '追加中...' : '追加'}
              </button>
            </div>
          </div>
        </Modal>

        {/* スタッフ編集モーダル */}
        <StaffEditModal
          isOpen={showStaffEditModal}
          onClose={handleCloseStaffEdit}
          staff={selectedStaff}
          onSave={handleUpdateStaff}
          onDelete={handleDeleteStaff}
        />
      </div>
    </Layout>
  )
}

export default StaffManagementPage 