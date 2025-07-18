import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';

// ... existing code ...

// 添加IPC处理程序
ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(options);
  return result;
});

// ... rest of the code ... 