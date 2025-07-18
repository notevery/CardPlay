import { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import 'xterm/css/xterm.css';
import { Operator } from '../services/operatorService';
import { useNavigate, useParams } from 'react-router-dom';
import { operatorService } from '../services/operatorService';
import FileTransferModal from './FileTransferModal';
import { WS_ENDPOINTS } from '../config/api';

const SSHTerminal: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const terminalInstanceRef = useRef<Terminal | null>(null);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [operator, setOperator] = useState<Operator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showFileTransfer, setShowFileTransfer] = useState(false);
  const [currentServerPath, setCurrentServerPath] = useState('/root');
  const [isFileTransferOpen, setIsFileTransferOpen] = useState(false);

  useEffect(() => {
    const fetchOperator = async () => {
      if (!id) {
        setError('未找到资源ID');
        setLoading(false);
        return;
      }

      try {
        const data = await operatorService.getOperatorById(id);
        if (!data) {
          setError('未找到资源');
          setLoading(false);
          return;
        }
        setOperator(data);
      } catch (err) {
        setError('获取资源失败');
        console.error('获取资源失败:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOperator();
  }, [id]);

  useEffect(() => {
    if (!operator || !terminalRef.current) return;

    // 初始化终端
    const terminal = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Courier New, monospace',
      // fontFamily: '"Fira Code", "Courier New", monospace, "Microsoft YaHei", "WenQuanYi Micro Hei"',
      theme: {
        background: '#1a1a1a',
        foreground: '#ffffff'
      }
    });

    // 调试键盘输入
    terminal.onKey(({ key, domEvent }) => {
      //console.log('Key:', key, 'Code:', domEvent.code, 'KeyCode:', domEvent.keyCode, 'Shift:', domEvent.shiftKey);
      terminal.write(key); // 手动写入按键
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);
    terminal.open(terminalRef.current);
    fitAddon.fit();

    terminalInstanceRef.current = terminal;

    // 建立WebSocket连接
    const ws = new WebSocket(WS_ENDPOINTS.ssh(operator.id));
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket连接已建立');
      // // 设置环境变量以支持中文
      // ws.send('export LANG=en_US.UTF-8\n');
      // ws.send('export LC_ALL=en_US.UTF-8\n');
      // ws.send('export TERM=xterm\n');
      terminal.write('\r\n\x1B[1;32m已连接到SSH服务器\x1B[0m\r\n');
    };

    ws.onmessage = (event) => {
      // 检查是否是文件下载数据
      if (event.data instanceof Blob) {
        const blob = event.data;
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result;
          if (typeof result === 'string') {
            try {
              const data = JSON.parse(result);
              if (data.type === 'file_download_start') {
                // 开始接收文件数据
                terminal.write(`\r\n\x1B[1;33m开始下载文件: ${data.filename}\x1B[0m\r\n`);
              } else if (data.type === 'file_download_end') {
                // 文件下载完成，创建下载链接
                const url = URL.createObjectURL(new Blob([data.content]));
                const a = document.createElement('a');
                a.href = url;
                a.download = data.filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                terminal.write(`\r\n\x1B[1;32m文件下载完成: ${data.filename}\x1B[0m\r\n`);
                terminal.write(`\r\n\x1B[1;36m文件已保存到浏览器的默认下载目录\x1B[0m\r\n`);
              } else if (data.type === 'error') {
                terminal.write(`\r\n\x1B[1;31m错误: ${data.message}\x1B[0m\r\n`);
              }
            } catch (e) {
              // 如果不是JSON，则作为普通终端输出处理
              terminal.write(event.data);
            }
          }
        };
        reader.readAsText(blob);
      } else {
        // 检查是否是JSON消息
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'error') {
            terminal.write(`\r\n\x1B[1;31m错误: ${data.message}\x1B[0m\r\n`);
            return;
          }
        } catch (e) {
          // 如果不是JSON，则作为普通终端输出处理
          terminal.write(event.data);
        }
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket错误:', error);
      terminal.write('\r\n\x1B[1;31m连接错误\x1B[0m\r\n');
    };

    ws.onclose = () => {
      console.log('WebSocket连接已关闭');
      terminal.write('\r\n\x1B[1;33m连接已关闭\x1B[0m\r\n');
    };

    // 处理终端输入
    terminal.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        // 检查是否是下载命令
        if (data.trim().startsWith('download ')) {
          const filename = data.trim().substring(9).trim();
          if (filename) {
            ws.send(JSON.stringify({
              type: 'file_download',
              filename: filename
            }));
            return;
          }
        }
        ws.send(data);
      }
    });

    // 处理窗口大小变化
    const handleResize = () => {
      fitAddon.fit();
    };
    window.addEventListener('resize', handleResize);

    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize);
      terminal.dispose();
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [operator]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const terminal = terminalInstanceRef.current;
    if (!terminal || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    // 获取当前目录
    const getCurrentDirectory = () => {
      return new Promise<string>((resolve) => {
        // 发送 pwd 命令
        wsRef.current?.send("pwd\n");
        
        // 设置一个临时处理器来捕获 pwd 的输出
        const originalOnMessage = wsRef.current!.onmessage;
        const timeout = setTimeout(() => {
          wsRef.current!.onmessage = originalOnMessage;
          resolve("/root"); // 超时后使用默认目录
        }, 1000);

        wsRef.current!.onmessage = (event) => {
          const output = event.data;
          if (output.includes("/")) {
            clearTimeout(timeout);
            wsRef.current!.onmessage = originalOnMessage;
            // 提取目录路径
            const match = output.match(/(\/[^\n\r]+)/);
            resolve(match ? match[1].trim() : "/root");
          }
        };
      });
    };

    for (const file of files) {
      try {
        terminal.write(`\r\n\x1B[1;33m正在上传文件: ${file.name}\x1B[0m\r\n`);
        
        // 获取当前目录
        const currentDir = await getCurrentDirectory();
        terminal.write(`\r\n\x1B[1;33m当前目录: ${currentDir}\x1B[0m\r\n`);
        
        // 读取文件内容
        const reader = new FileReader();
        reader.onload = async (e) => {
          if (!e.target?.result) return;
          
          // 发送文件上传开始标记，包含当前目录
          wsRef.current?.send(JSON.stringify({
            type: 'file_upload_start',
            filename: file.name,
            size: file.size,
            directory: currentDir
          }));

          // 将文件内容分块发送
          const chunkSize = 64 * 1024; // 64KB chunks
          const content = e.target.result as ArrayBuffer;
          const totalChunks = Math.ceil(content.byteLength / chunkSize);

          for (let i = 0; i < totalChunks; i++) {
            const start = i * chunkSize;
            const end = Math.min(start + chunkSize, content.byteLength);
            const chunk = content.slice(start, end);

            // 使用 setTimeout 避免阻塞主线程
            await new Promise<void>((resolve) => {
              setTimeout(() => {
                try {
                  if (wsRef.current?.readyState === WebSocket.OPEN) {
                    wsRef.current.send(chunk);
                    // 更新进度
                    const progress = Math.round(((i + 1) / totalChunks) * 100);
                    terminal.write(`\r\x1B[1;33m上传进度: ${progress}%\x1B[0m`);
                  } else {
                    throw new Error('WebSocket连接已关闭');
                  }
                } catch (error: unknown) {
                  const err = error as Error;
                  terminal.write(`\r\n\x1B[1;31m上传失败: ${err.message}\x1B[0m\r\n`);
                  throw err;
                }
                resolve();
              }, 0);
            });
          }

          // 发送文件上传结束标记
          wsRef.current?.send(JSON.stringify({
            type: 'file_upload_end',
            filename: file.name
          }));

          terminal.write('\r\n\x1B[1;32m文件上传完成\x1B[0m\r\n');
        };

        reader.readAsArrayBuffer(file);
      } catch (err) {
        console.error('文件上传失败:', err);
        terminal.write(`\r\n\x1B[1;31m文件上传失败: ${file.name}\x1B[0m\r\n`);
      }
    }
  };

  const handlePathChange = (newPath: string) => {
    console.log('更新服务器路径:', newPath);
    setCurrentServerPath(newPath);
  };

  if (loading) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    );
  }

  if (!operator) {
    return null;
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      <div className="bg-gray-800 p-4 flex justify-between items-center">
        <h1 className="text-white text-lg font-semibold">
          {operator.name} - SSH终端
        </h1>
        <button
          onClick={() => setShowFileTransfer(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          文件传输
        </button>
      </div>
      <div className="flex-1 flex">
        <div 
          ref={terminalRef} 
          className={`flex-1 p-4 relative ${isDragging ? 'bg-blue-900 bg-opacity-20' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isDragging && (
            <div className="absolute inset-0 flex items-center justify-center bg-blue-900 bg-opacity-20 pointer-events-none">
              <div className="text-white text-xl font-semibold">拖放文件以上传</div>
            </div>
          )}
        </div>
      </div>
      {showFileTransfer && (
        <FileTransferModal
          isOpen={showFileTransfer}
          onClose={() => setShowFileTransfer(false)}
          wsRef={wsRef}
          currentServerPath={currentServerPath}
          onPathChange={handlePathChange}
        />
      )}
    </div>
  );
};

export default SSHTerminal; 