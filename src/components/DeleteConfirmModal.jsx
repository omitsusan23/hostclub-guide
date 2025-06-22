import React from 'react';

const DeleteConfirmModal = ({ isOpen, onConfirm, onCancel, itemName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
            削除確認
          </h3>
          
          <p className="text-gray-600 text-center mb-6">
            「{itemName}」の案内記録を削除しますか？
            <br />
            <span className="text-sm text-red-500 mt-2 block">
              この操作は取り消せません
            </span>
          </p>
          
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors duration-200"
            >
              キャンセル
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors duration-200"
            >
              削除
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal; 