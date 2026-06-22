import React from 'react';

export default function ConfirmModal({
  title,
  description,
  danger,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: React.ReactNode;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content max-w-sm" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">{title}</h3>
        <div className="text-sm text-slate-500 mb-6">{description}</div>
        <div className="flex items-center justify-end gap-3">
          <button onClick={onCancel} className="btn-secondary">取消</button>
          <button onClick={onConfirm} className={danger ? 'btn-danger' : 'btn-primary'}>
            确认
          </button>
        </div>
      </div>
    </div>
  );
}

