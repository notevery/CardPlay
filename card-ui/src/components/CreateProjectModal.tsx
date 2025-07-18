import type React from 'react';
import { useState } from 'react';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (project: { myId: string; name: string }) => void;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [projectName, setProjectName] = useState('');
  const [projectMyId, setProjectMyId] = useState('');
  const [myIdError, setMyIdError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleMyIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    // 只允许大写字母和数字
    const isValid = /^[A-Z0-9]*$/.test(value);
    
    if (isValid) {
      setProjectMyId(value);
      setMyIdError(null);
    } else {
      setMyIdError('项目ID只能包含大写字母和数字');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectName.trim() && projectMyId.trim() && !myIdError) {
      onSubmit({
        myId: projectMyId.trim(),
        name: projectName.trim()
      });
      setProjectName('');
      setProjectMyId('');
      setMyIdError(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">创建新项目</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="projectMyId" className="block text-sm font-medium text-gray-700 mb-2">
              项目ID
            </label>
            <input
              type="text"
              id="projectMyId"
              value={projectMyId}
              onChange={handleMyIdChange}
              className={`w-full px-3 py-2 border ${myIdError ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="请输入项目ID（大写字母和数字）"
              required
              pattern="[A-Z0-9]*"
              title="只能输入大写字母和数字"
            />
            {myIdError && (
              <p className="mt-1 text-sm text-red-600">{myIdError}</p>
            )}
          </div>
          <div className="mb-4">
            <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-2">
              项目名称
            </label>
            <input
              type="text"
              id="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入项目名称"
              required
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!!myIdError}
            >
              创建
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal; 