import React from 'react';

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Yes",
  cancelText = "No",
  isProcessing = false,
  personToDelete = null
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-6 sm:p-8 text-center">
        <h3 className="text-xl sm:text-2xl font-bold text-[#123645] pb-4 leading-snug">
          {title === "Confirm Delete" ? (
            <>
              Are you sure you want to delete{' '}
              <span className="whitespace-nowrap">
                {personToDelete?.name ||
                  `${personToDelete?.lastName || ''}, ${personToDelete?.firstName || ''} ${personToDelete?.middleName || ''}`}
              </span>
              ?
            </>
          ) : (
            message
          )}
        </h3>

        <div className="flex justify-center gap-4">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="bg-gray-300 text-[#123645] font-semibold px-6 py-2.5 rounded-full hover:bg-gray-400 transition duration-200 w-24 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className="bg-[#2c526b] text-white font-semibold px-6 py-2.5 rounded-full hover:bg-[#1e3b50] transition duration-200 w-24 disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
