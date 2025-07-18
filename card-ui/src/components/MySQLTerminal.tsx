import { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import 'xterm/css/xterm.css';
import { Operator } from '../services/operatorService';
import { useNavigate, useParams } from 'react-router-dom';
import { operatorService } from '../services/operatorService';

const MySQLTerminal: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const terminalInstanceRef = useRef<Terminal | null>(null);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [operator, setOperator] = useState<Operator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      fontFamily: '"Fira Code", "Courier New", monospace, "Microsoft YaHei", "WenQuanYi Micro Hei"',
      theme: {
        background: '#1a1a1a',
        foreground: '#ffffff'
      }
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);
    terminal.open(terminalRef.current);
    fitAddon.fit();

    terminalInstanceRef.current = terminal;

    // 建立WebSocket连接
    const ws = new WebSocket(`ws://localhost:3000/ws/mysql/${operator.id}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket连接已建立');
      terminal.write('\r\n\x1B[1;32m已连接到MySQL服务器\x1B[0m\r\n');
      terminal.write('\r\n\x1B[1;36m请输入SQL命令\x1B[0m\r\n');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'error') {
          terminal.write(`\r\n\x1B[1;31m错误: ${data.message}\x1B[0m\r\n`);
          return;
        }
        if (data.type === 'query_result') {
          // 显示查询结果
          terminal.write('\r\n');
          if (data.columns) {
            // 显示列名
            terminal.write(data.columns.join('\t') + '\r\n');
            terminal.write('-'.repeat(data.columns.join('\t').length) + '\r\n');
          }
          if (data.rows) {
            // 显示数据行
            data.rows.forEach((row: any[]) => {
              terminal.write(row.join('\t') + '\r\n');
            });
          }
          terminal.write(`\r\n\x1B[1;32m查询完成，影响行数: ${data.affectedRows || 0}\x1B[0m\r\n`);
        }
      } catch (e) {
        // 如果不是JSON，则作为普通终端输出处理
        terminal.write(event.data);
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
          {operator.name} - MySQL终端
        </h1>
      </div>
      <div className="flex-1 flex">
        <div 
          ref={terminalRef} 
          className="flex-1 p-4"
        />
      </div>
    </div>
  );
};

export default MySQLTerminal; 