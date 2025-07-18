import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import { getOperators, type Operator } from '../services/operatorService';
import { ProtocolType } from '../services/categoryService';
import CreateOperatorModal from './CreateOperatorModal';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import 'xterm/css/xterm.css';

interface OperatorGridProps {
  searchTerm: string;
  selectedCategory: string;
  selectedProject: string;
}

const OperatorGrid: React.FC<OperatorGridProps> = ({ searchTerm, selectedCategory, selectedProject }) => {
  const [sortOrder, setSortOrder] = useState<'a-z' | 'z-a'>('a-z');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [currentOperator, setCurrentOperator] = useState<Operator | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const terminalInstanceRef = useRef<Terminal | null>(null);

  // 处理SSH连接
  const handleSSHConnection = (operator: Operator) => {
    // 在新标签页中打开终端
    const terminalUrl = `/terminal/${operator.id}`;
    window.open(terminalUrl, '_blank');
  };

  // 处理操作符点击
  const handleOperatorClick = (operator: Operator) => {
    // 根据category（ProtocolType）处理不同的跳转逻辑
    switch (operator.category) {
      case ProtocolType.SSH:
        handleSSHConnection(operator);
        break;
      case ProtocolType.MYSQL:
        // 在新标签页中打开 MySQL 终端
        const mysqlUrl = `/mysql/${operator.id}`;
        window.open(mysqlUrl, '_blank');
        break;
      case ProtocolType.HTTP:
      default:
        window.open(operator.url, '_blank');
        break;
    }
  };

  // Fetch operators from API
  useEffect(() => {
    const fetchOperators = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getOperators({
          search: searchTerm,
          category: selectedCategory,
          project: selectedProject,
          sort: sortOrder === 'a-z' ? 'asc' : 'desc'
        });

        setOperators(data);
      } catch (err) {
        console.error('Error fetching operators:', err);
        setError('获取数据失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    fetchOperators();
  }, [searchTerm, selectedCategory, selectedProject, sortOrder]);

  const handleCreateSuccess = () => {
    const fetchOperators = async () => {
      try {
        const data = await getOperators({
          search: searchTerm,
          category: selectedCategory,
          project: selectedProject,
          sort: sortOrder === 'a-z' ? 'asc' : 'desc'
        });
        setOperators(data);
      } catch (err) {
        console.error('Error refreshing operators:', err);
      }
    };
    fetchOperators();
  };

  // 处理窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      if (terminalInstanceRef.current) {
        const fitAddon = new FitAddon();
        terminalInstanceRef.current.loadAddon(fitAddon);
        fitAddon.fit();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex-1">
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-wrap justify-between items-center">
          <div className="mb-4 md:mb-0">
            <span className="text-gray-600">{operators.length} 个资源</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <span className="text-gray-600 mr-2">视图</span>
              <div className="flex border border-gray-300 rounded overflow-hidden">
                <button
                  className={`p-2 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-800' : 'bg-white text-gray-600'}`}
                  onClick={() => setViewMode('grid')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  className={`p-2 ${viewMode === 'list' ? 'bg-blue-100 text-blue-800' : 'bg-white text-gray-600'}`}
                  onClick={() => setViewMode('list')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-gray-600 mr-2">排序</span>
              <button
                className="flex items-center border border-gray-300 rounded px-3 py-1 bg-white"
                onClick={() => setSortOrder(sortOrder === 'a-z' ? 'z-a' : 'a-z')}
              >
                {sortOrder === 'a-z' ? 'A-Z' : 'Z-A'} {sortOrder === 'a-z' ? '▼' : '▲'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800 mx-auto mb-4" />
          <p className="text-gray-600">加载中...</p>
        </div>
      )}

      {error && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {!loading && (
        <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'grid-cols-1 gap-4'}`}>
          {/* 创建卡片 */}
          <div
            className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-200 border-2 border-dashed border-gray-300 flex items-center justify-center"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full mb-4 flex items-center justify-center mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">添加新资源</h3>
              <p className="text-gray-600">点击添加新的资源</p>
            </div>
          </div>

          {/* 资源列表 */}
          {operators.map((operator) => (
            <div
              key={operator.id}
              className={`bg-white rounded-lg shadow-md overflow-hidden ${viewMode === 'list' ? 'flex' : ''} cursor-pointer hover:shadow-lg transition-shadow duration-200`}
              onClick={() => handleOperatorClick(operator)}
            >
              {viewMode === 'list' && (
                <div className="w-20 h-20 flex-shrink-0 bg-gray-200 flex items-center justify-center">
                  {operator.logo ? (
                    <img src={operator.logo} alt={`${operator.name} logo`} className="max-w-full max-h-full p-2" />
                  ) : (
                    <div className="text-gray-400 text-xs text-center">无Logo</div>
                  )}
                </div>
              )}
              <div className="p-6">
                {viewMode === 'grid' && operator.logo && (
                  <div className="w-16 h-16 bg-gray-200 rounded-full mb-4 flex items-center justify-center overflow-hidden">
                    <img src={operator.logo} alt={`${operator.name} logo`} className="max-w-full max-h-full p-2" />
                  </div>
                )}
                <h3 className="text-xl font-semibold text-blue-800 mb-2">{operator.name}</h3>
                <div className="text-sm text-gray-600 mb-2">提供者: {operator.provider}</div>
                <p className="text-gray-700 mb-4">{operator.description}</p>
                <div className="text-sm text-gray-500">创建时间: {operator.createdAt}</div>
                <div className="text-sm text-gray-500">协议类型: {operator.category}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && operators.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">未找到资源</h3>
          <p className="text-gray-600">请尝试调整搜索或筛选条件</p>
        </div>
      )}

      {/* SSH终端模态框 */}
      {isTerminalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-4 w-full max-w-4xl h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white text-lg font-semibold">
                {currentOperator?.name} - SSH终端
              </h3>
              <button
                onClick={() => {
                  setIsTerminalOpen(false);
                  if (wsRef.current) {
                    wsRef.current.close();
                  }
                  if (terminalInstanceRef.current) {
                    terminalInstanceRef.current.dispose();
                    terminalInstanceRef.current = null;
                  }
                }}
                className="text-gray-400 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div ref={terminalRef} className="flex-1 bg-black rounded overflow-hidden" />
          </div>
        </div>
      )}

      <CreateOperatorModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
};

export default OperatorGrid;
