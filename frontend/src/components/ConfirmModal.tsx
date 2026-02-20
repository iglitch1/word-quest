import React from 'react';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDangerous?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isDangerous = false,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 animate-slideDown">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">{title}</h2>
        <p className="text-gray-600 text-center mb-8 text-lg">{message}</p>

        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="btn-secondary flex-1 py-4"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`btn flex-1 py-4 font-bold text-lg transition-all active:scale-95 ${
              isDangerous
                ? 'bg-red-500 text-white'
                : 'bg-gradient-to-r from-yellow-300 to-orange-400 text-white'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
