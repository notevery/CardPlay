import React, { useEffect, useState, useRef } from 'react';

interface FileItem {
  name: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: string;
}

interface FileTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  wsRef: React.RefObject<WebSocket>;
  currentServerPath: string;
  onPathChange: (newPath: string) => void;
}

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onDownload: () => void;
  isFile: boolean;
}

interface DirectorySelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (path: string) => void;
}

interface UploadProgress {
  filename: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
}

// 定义 Electron API 类型
interface ElectronAPI {
  showOpenDialog: (options: {
    properties: string[];
    title: string;
  }) => Promise<{
    canceled: boolean;
    filePaths: string[];
  }>;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

const DirectorySelectModal: React.FC<DirectorySelectModalProps> = ({
  isOpen,
  onClose,
  onConfirm
}) => {
  const [selectedPath, setSelectedPath] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-96">
        <h3 className="text-white text-lg font-semibold mb-4">选择下载目录</h3>
        <input
          type="text"
          value={selectedPath}
          onChange={(e) => setSelectedPath(e.target.value)}
          placeholder="请输入下载目录路径"
          className="w-full px-3 py-2 bg-gray-700 text-white rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
          >
            取消
          </button>
          <button
            onClick={() => {
              onConfirm(selectedPath);
              onClose();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
};

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onClose, onDownload, isFile }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed bg-gray-800 border border-gray-700 rounded-lg shadow-lg py-1 z-50"
      style={{ left: x, top: y }}
    >
      {isFile && (
        <button
          onClick={() => {
            onDownload();
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 hover:text-white"
        >
          下载
        </button>
      )}
    </div>
  );
};

const FileTransferModal: React.FC<FileTransferModalProps> = ({
  isOpen,
  onClose,
  wsRef,
  currentServerPath,
  onPathChange
}) => {
  const [serverFiles, setServerFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    file: FileItem;
  } | null>(null);
  const [isDirectorySelectOpen, setIsDirectorySelectOpen] = useState(false);
  const [selectedFileForDownload, setSelectedFileForDownload] = useState<string | null>(null);
  const directoryInputRef = useRef<HTMLInputElement>(null);
  const downloadContentRef = useRef<string[]>([]);
  const downloadFilenameRef = useRef<string | null>(null);
  const downloadTotalSizeRef = useRef<number>(0);
  const downloadReceivedSizeRef = useRef<number>(0);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [showUploadSuccess, setShowUploadSuccess] = useState(false);

  // 刷新文件列表
  const refreshFileList = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('刷新文件列表，当前路径:', currentServerPath);
      setIsLoading(true);
      wsRef.current.send(JSON.stringify({
        type: 'list_files',
        path: currentServerPath
      }));
    }
  };

  // 当模态框打开或路径改变时获取文件列表
  useEffect(() => {
    if (isOpen && wsRef.current?.readyState === WebSocket.OPEN) {
      refreshFileList();
    }
  }, [isOpen, currentServerPath, wsRef]);

  // 监听 WebSocket 消息
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    console.log('设置WebSocket消息监听器');

    const handleMessage = (event: MessageEvent) => {
      if (!mounted) return;
      
      console.log('收到WebSocket消息:', event.data);
      
      try {
        const data = JSON.parse(event.data);
        console.log('解析后的消息:', data);

        if (data.type === 'file_list') {
          setServerFiles(data.files);
          setIsLoading(false);
        } else if (data.type === 'error') {
          console.error('获取文件列表失败:', data.message);
          setIsLoading(false);
        } else if (data.type === 'file_download_start') {
          // 开始下载，记录文件名和总大小
          downloadFilenameRef.current = data.filename.split('/').pop() || 'download';
          downloadContentRef.current = [];
          downloadTotalSizeRef.current = data.totalSize || 0;
          downloadReceivedSizeRef.current = 0;
          console.log('开始下载文件:', downloadFilenameRef.current, '总大小:', downloadTotalSizeRef.current);
        } else if (data.type === 'file_download_chunk' && data.content) {
          // 接收文件块
          downloadContentRef.current.push(data.content);
          downloadReceivedSizeRef.current += data.chunkSize || 0;
          
          // 计算下载进度
          const progress = (downloadReceivedSizeRef.current / downloadTotalSizeRef.current) * 100;
          console.log(`下载进度: ${progress.toFixed(2)}%`);
        } else if (data.type === 'file_download_end') {
          // 下载完成，合并所有块并触发下载
          const filename = downloadFilenameRef.current || 'download';
          console.log('文件下载完成，开始合并数据块');
          
          try {
            // 合并所有数据块
            const allContent = downloadContentRef.current.join('');
            
            // 将Base64内容转换为Blob
            const byteCharacters = atob(allContent);
            const byteArrays = [];
            for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
              const slice = byteCharacters.slice(offset, offset + 1024);
              const byteNumbers = new Array(slice.length);
              for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              byteArrays.push(byteArray);
            }
            const blob = new Blob(byteArrays, { type: 'application/octet-stream' });
            
            // 创建下载链接并触发下载
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            console.log('文件下载完成并已保存:', filename);
          } catch (error) {
            console.error('处理下载文件时出错:', error);
          } finally {
            // 清理引用
            downloadContentRef.current = [];
            downloadFilenameRef.current = null;
            downloadTotalSizeRef.current = 0;
            downloadReceivedSizeRef.current = 0;
          }
        } else if (data.type === 'file_upload_progress') {
          // 更新上传进度
          setUploadProgress(prev => prev.map(item => 
            item.filename === data.filename 
              ? { ...item, progress: data.progress }
              : item
          ));
        } else if (data.type === 'file_upload_complete') {
          // 更新上传状态为成功
          setUploadProgress(prev => prev.map(item => 
            item.filename === data.filename 
              ? { ...item, status: 'success', progress: 100 }
              : item
          ));
          // 显示上传成功提示
          setShowUploadSuccess(true);
          setTimeout(() => setShowUploadSuccess(false), 3000);
          
          // 刷新文件列表
          refreshFileList();
        } else if (data.type === 'file_upload_error') {
          // 更新上传状态为错误
          setUploadProgress(prev => prev.map(item => 
            item.filename === data.filename 
              ? { ...item, status: 'error' }
              : item
          ));
        }
      } catch (e) {
        console.log('非JSON消息，忽略');
      }
    };

    if (wsRef.current) {
      wsRef.current.addEventListener('message', handleMessage);
    }

    return () => {
      console.log('清理WebSocket消息监听器');
      mounted = false;
      if (wsRef.current) {
        wsRef.current.removeEventListener('message', handleMessage);
      }
    };
  }, [isOpen, wsRef, currentServerPath]);

  const handleServerFileClick = (file: FileItem) => {
    if (file.type === 'directory') {
      const newPath = currentServerPath + '/' + file.name;
      console.log('切换到目录:', newPath);
      onPathChange(newPath);
    }
  };

  const handleUpload = async () => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.style.display = 'none';
      document.body.appendChild(input);

      input.onchange = async (e) => {
        const files = (e.target as HTMLInputElement).files;
        if (files) {
          // 初始化上传进度
          const newProgress: UploadProgress[] = Array.from(files).map(file => ({
            filename: file.name,
            progress: 0,
            status: 'uploading'
          }));
          setUploadProgress(prev => [...prev, ...newProgress]);

          // 逐个处理文件上传
          for (const file of Array.from(files)) {
            const reader = new FileReader();
            
            // 使用 Promise 包装文件读取过程
            await new Promise<void>((resolve) => {
              reader.onload = (e) => {
                if (e.target?.result) {
                  // 发送上传开始消息
                  wsRef.current?.send(JSON.stringify({
                    type: 'file_upload_start',
                    filename: file.name,
                    size: file.size,
                    directory: currentServerPath
                  }));

                  // 发送文件内容
                  wsRef.current?.send(e.target.result);

                  // 发送上传完成消息
                  wsRef.current?.send(JSON.stringify({
                    type: 'file_upload_end',
                    filename: file.name
                  }));

                  // 更新进度为完成
                  setUploadProgress(prev => prev.map(item => 
                    item.filename === file.name 
                      ? { ...item, status: 'success', progress: 100 }
                      : item
                  ));
                }
                resolve();
              };

              reader.onerror = () => {
                // 更新进度为错误
                setUploadProgress(prev => prev.map(item => 
                  item.filename === file.name 
                    ? { ...item, status: 'error' }
                    : item
                ));
                resolve();
              };

              // 开始读取文件
              reader.readAsArrayBuffer(file);
            });
          }

          // 所有文件处理完成后刷新文件列表
          refreshFileList();
        }
        document.body.removeChild(input);
      };

      input.click();
    } catch (err) {
      console.error('文件上传失败:', err);
    }
  };

  const handleDownload = () => {
    selectedFileForDownload && wsRef.current?.send(JSON.stringify({
      type: 'file_download',
      filename: currentServerPath + '/' + selectedFileForDownload,
      downloadPath: selectedFileForDownload
    }));
    setSelectedFileForDownload(null);
  };

  // 添加路径规范化函数
  const normalizePath = (path: string): string => {
    // 处理路径中的 . 和 ..
    const parts = path.split('/').filter(Boolean);
    const result: string[] = [];
    
    for (const part of parts) {
      if (part === '..') {
        result.pop();
      } else if (part !== '.') {
        result.push(part);
      }
    }
    
    return '/' + result.join('/');
  };

  const handleContextMenu = (event: React.MouseEvent, file: FileItem) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      file
    });
  };

  const handleDownloadFile = async (filename: string) => {
    // 从 WebSocket URL 中获取 operatorId
    const operatorId = wsRef.current?.url.split('/').pop();
    if (!operatorId) {
      console.error('无法获取 operatorId');
      return;
    }

    try {
      // 构建下载 URL
      const downloadUrl = `/api/download?path=${encodeURIComponent(currentServerPath + '/' + filename)}`;
      
      // 使用 fetch 下载文件
      const response = await fetch(downloadUrl, {
        headers: {
          'X-Operator-Id': operatorId
        }
      });

      if (!response.ok) {
        throw new Error(`下载失败: ${response.statusText}`);
      }

      // 获取文件 blob
      const blob = await response.blob();
      
      // 创建下载链接并触发下载
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('下载文件时出错:', error);
    }
  };

  const handleDirectorySelect = (downloadPath: string) => {
    if (selectedFileForDownload) {
      console.log('下载文件:', selectedFileForDownload, '到目录:', downloadPath);
      wsRef.current?.send(JSON.stringify({
        type: 'file_download',
        filename: currentServerPath + '/' + selectedFileForDownload,
        downloadPath: downloadPath
      }));
      setSelectedFileForDownload(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-4/5 h-4/5 flex flex-col">
        <div className="p-4 border-b border-gray-700 flex-shrink-0 flex justify-between items-center">
          <h2 className="text-white text-xl font-semibold">文件传输</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-3xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-700 transition-colors"
          >
            ×
          </button>
        </div>
        <div className="flex-1 flex p-4 gap-4 min-h-0">
          {/* 本地文件选择 */}
          <div className="flex-1 bg-gray-900 rounded-lg flex flex-col">
            <div className="p-4 border-b border-gray-700 flex-shrink-0">
              <div className="text-white mb-2">本地文件</div>
              <div className="flex gap-2">
                <button
                  onClick={handleUpload}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  选择文件上传
                </button>
              </div>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              {uploadProgress.length > 0 ? (
                <div className="space-y-2">
                  {uploadProgress.map((item) => (
                    <div key={item.filename} className="bg-gray-800 rounded p-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-300 truncate">{item.filename}</span>
                        <span className={`${
                          item.status === 'success' ? 'text-green-500' :
                          item.status === 'error' ? 'text-red-500' :
                          'text-gray-400'
                        }`}>
                          {item.status === 'success' ? '完成' :
                           item.status === 'error' ? '失败' :
                           `${item.progress}%`}
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${
                            item.status === 'success' ? 'bg-green-500' :
                            item.status === 'error' ? 'bg-red-500' :
                            'bg-blue-500'
                          }`}
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-400">
                  点击"选择文件上传"按钮选择要上传的文件
                </div>
              )}
            </div>
          </div>

          {/* 服务器文件列表 */}
          <div className="flex-1 bg-gray-900 rounded-lg flex flex-col">
            <div className="p-4 border-b border-gray-700 flex-shrink-0">
              <div className="flex justify-between items-center mb-2">
                <div className="text-white">服务器目录: {normalizePath(currentServerPath)}</div>
                <button
                  onClick={refreshFileList}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  刷新
                </button>
              </div>
            </div>
            <div className="flex-1 relative">
              <div className="absolute inset-0 overflow-y-auto">
                <div className="p-4">
                  {isLoading ? (
                    <div className="text-gray-400">加载中...</div>
                  ) : serverFiles.length === 0 ? (
                    <div className="text-gray-400">目录为空</div>
                  ) : (
                    <div className="space-y-1">
                      {serverFiles.map((file) => (
                        <div
                          key={file.name}
                          onClick={() => handleServerFileClick(file)}
                          onContextMenu={(e) => handleContextMenu(e, file)}
                          className={`p-2 rounded cursor-pointer flex items-center ${
                            selectedFileForDownload === file.name
                              ? 'bg-blue-600 text-white'
                              : 'hover:bg-gray-700 text-gray-300'
                          }`}
                        >
                          <span className="mr-2">
                            {file.type === 'directory' ? '📁' : '📄'}
                          </span>
                          <span className="flex-1 truncate">{file.name}</span>
                          {file.type === 'file' && file.size && (
                            <span className="text-sm text-gray-400 ml-2 whitespace-nowrap">
                              {(file.size / 1024).toFixed(1)}KB
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 上传成功提示 */}
      {showUploadSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg">
          文件上传成功
        </div>
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onDownload={() => handleDownloadFile(contextMenu.file.name)}
          isFile={contextMenu.file.type === 'file'}
        />
      )}

      <DirectorySelectModal
        isOpen={isDirectorySelectOpen}
        onClose={() => {
          setIsDirectorySelectOpen(false);
          setSelectedFileForDownload(null);
        }}
        onConfirm={handleDirectorySelect}
      />
    </div>
  );
};

export default FileTransferModal; 