package com.leaderjs.operator.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jcraft.jsch.Channel;
import com.jcraft.jsch.ChannelSftp;
import com.jcraft.jsch.JSch;
import com.jcraft.jsch.Session;
import com.jcraft.jsch.SftpATTRS;
import com.jcraft.jsch.ChannelShell;
import com.leaderjs.operator.model.Operator;
import com.leaderjs.operator.repository.OperatorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.ArrayList;
import java.util.Date;
import java.util.Arrays;

@Controller
public class SSHWebSocketController extends TextWebSocketHandler {
    private static final Logger logger = LoggerFactory.getLogger(SSHWebSocketController.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private OperatorRepository operatorRepository;

    // 存储WebSocket会话和对应的SSH会话
    private final Map<String, WebSocketSession> webSocketSessions = new ConcurrentHashMap<>();
    private final Map<String, Session> sshSessions = new ConcurrentHashMap<>();
    private final Map<String, Channel> sshChannels = new ConcurrentHashMap<>();
    private final Map<String, ChannelSftp> sftpChannels = new ConcurrentHashMap<>();
    private final Map<String, FileUploadState> fileUploadStates = new ConcurrentHashMap<>();

    private String bytesToHex(byte[] bytes, int length) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < length; i++) {
            sb.append(String.format("%02X ", bytes[i]));
        }
        return sb.toString();
    }

    private String bytesToHex(byte[] bytes) {
        return bytesToHex(bytes, bytes.length);
    }

    @Autowired
    public SSHWebSocketController(OperatorRepository operatorRepository) {
        this.operatorRepository = operatorRepository;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String operatorId = extractOperatorId(session);
        logger.info("WebSocket连接已建立，operatorId: {}", operatorId);
        
        webSocketSessions.put(operatorId, session);

        // 获取Operator信息
        Operator operator = operatorRepository.findById(operatorId)
                .orElseThrow(() -> new RuntimeException("Operator not found: " + operatorId));
        logger.info("找到Operator: {}", operator.getName());

        try {
            // // 建立SSH连接
            // JSch jsch = new JSch();
            // Session sshSession = jsch.getSession(
            //     operator.getUsername(),
            //     operator.getHost(),
            //     operator.getPort()
            // );
            // sshSession.setPassword(operator.getPassword());
            // sshSession.setConfig("StrictHostKeyChecking", "no");
            // // 设置终端类型为 xterm
            // sshSession.setConfig("TerminalType", "xterm");
            // logger.info("正在连接SSH服务器: {}:{}", operator.getHost(), operator.getPort());
            // sshSession.connect(30000); // 30秒超时
            // logger.info("SSH连接已建立");

            // // 打开SSH通道
            // Channel channel = sshSession.openChannel("shell");
            // // 设置通道的终端类型
            // ChannelShell shell = (ChannelShell) channel;
            // shell.setPty(true); // ✅ 必须启用伪终端
            // shell.setPtyType("xterm"); // ✅ 使用现代终端类型
            // // 关键：告诉远程服务器终端语言环境使用 UTF-8
            // shell.setEnv("LANG", "en_US.UTF-8");
            // shell.setEnv("LC_ALL", "en_US.UTF-8");
            // shell.setEnv("TERM", "xterm");
            // channel.connect(3000);
            // logger.info("SSH通道已打开");


            // // 存储SSH会话和通道
            // sshSessions.put(operatorId, sshSession);
            // sshChannels.put(operatorId, channel);

            JSch jsch = new JSch();
            Session sshSession = jsch.getSession(operator.getUsername(), operator.getHost(), operator.getPort());
            sshSession.setPassword(operator.getPassword());
            sshSession.setConfig("StrictHostKeyChecking", "no");
            
            logger.info("正在连接SSH服务器: {}:{}", operator.getHost(), operator.getPort());
            sshSession.connect(30000); // 30秒超时
            logger.info("SSH连接已建立");
            
            // 打开 shell 通道
            // ChannelShell shell = (ChannelShell) sshSession.openChannel("shell");
            // 打开SSH通道
            Channel channel = sshSession.openChannel("shell");
            // 设置通道的终端类型
            ChannelShell shell = (ChannelShell) channel;
            shell.setPty(true);                 // 必须开启伪终端
            shell.setPtyType("xterm");         // 模拟 xterm 终端
            shell.setEnv("LANG", "en_US.UTF-8");
            shell.setEnv("LC_ALL", "en_US.UTF-8");
            // shell.setEnv("TERM", "xterm");
            
            shell.connect(3000);
            logger.info("SSH通道已打开");
            
            // 存储 session & shell
            sshSessions.put(operatorId, sshSession);
            sshChannels.put(operatorId, shell);
            



            // 启动线程读取SSH输出
            new Thread(() -> {
                try {
                    InputStream in = channel.getInputStream();
                    byte[] buffer = new byte[1024];
                    int i;
                    while ((i = in.read(buffer)) != -1) {
                        // String output = new String(buffer, 0, i);
                        String output = new String(buffer, 0, i, StandardCharsets.UTF_8);

                        logger.debug("SSH输出: {}", output);
                        logger.debug("SSH回显/输出: {}", output);
                        logger.debug("SSH回显/输出 (hex): {}", bytesToHex(buffer, i));
                        session.sendMessage(new TextMessage(output));
                    }
                } catch (Exception e) {
                    logger.error("读取SSH输出时发生错误", e);
                }
            }).start();
        } catch (Exception e) {
            logger.error("建立SSH连接时发生错误", e);
            session.close(CloseStatus.SERVER_ERROR.withReason("Failed to establish SSH connection: " + e.getMessage()));
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String operatorId = extractOperatorId(session);
        String payload = message.getPayload();
        logger.debug("收到WebSocket消息，operatorId: {}, message: {}", operatorId, payload);
        logger.debug("收到WebSocket输入: {}", payload);
        logger.debug("收到WebSocket输入 (hex): {}", bytesToHex(payload.getBytes(StandardCharsets.UTF_8)));

        try {
            // 尝试解析JSON消息
            Map<String, Object> jsonMessage = objectMapper.readValue(payload, Map.class);
            String type = (String) jsonMessage.get("type");

            if ("file_upload_start".equals(type)) {
                handleFileUploadStart(operatorId, jsonMessage);
            } else if ("file_upload_end".equals(type)) {
                handleFileUploadEnd(operatorId, jsonMessage);
            } else if ("file_download".equals(type)) {
                handleFileDownload(operatorId, jsonMessage, session);
            } else if ("list_files".equals(type)) {
                handleListFiles(operatorId, jsonMessage, session);
            }
        } catch (Exception e) {
            // 如果不是JSON消息，则作为普通SSH命令处理
            Channel channel = sshChannels.get(operatorId);
            if (channel != null && channel.isConnected()) {
                OutputStream out = channel.getOutputStream();
                byte[] inputBytes = payload.getBytes(StandardCharsets.UTF_8);
                out.write(inputBytes);
                out.flush();
                // 使用 UTF-8 编码发送数据
                // out.write(payload.getBytes(StandardCharsets.UTF_8));
                // out.flush();
                logger.debug("已发送到SSH通道: {}", payload);
                logger.debug("已发送到SSH通道 (hex): {}", bytesToHex(inputBytes));
                logger.debug("消息已发送到SSH通道: {}", payload);

                // 如果是 cd 命令，同步更新 SFTP 通道的工作目录
                if (payload.trim().startsWith("cd ")) {
                    String newPath = payload.trim().substring(3).trim();
                    ChannelSftp sftpChannel = sftpChannels.get(operatorId);
                    if (sftpChannel != null && sftpChannel.isConnected()) {
                        try {
                            sftpChannel.cd(newPath);
                            logger.info("SFTP通道工作目录已更新为: {}", newPath);
                        } catch (Exception ex) {
                            logger.error("更新SFTP通道工作目录失败", ex);
                        }
                    }
                }
            } else {
                logger.warn("SSH通道未连接或不存在");
            }
        }
    }

    @Override
    protected void handleBinaryMessage(WebSocketSession session, BinaryMessage message) {
        String operatorId = extractOperatorId(session);
        FileUploadState uploadState = fileUploadStates.get(operatorId);
        
        if (uploadState != null) {
            ChannelSftp sftpChannel = sftpChannels.get(operatorId);
            if (sftpChannel != null && sftpChannel.isConnected()) {
                try {
                    // 将文件数据写入临时文件
                    uploadState.writeChunk(message.getPayload().array());
                } catch (IOException e) {
                    logger.error("写入文件数据失败", e);
                }
            }
        }
    }

    private void handleFileUploadStart(String operatorId, Map<String, Object> message) {
        String filename = (String) message.get("filename");
        long size = ((Number) message.get("size")).longValue();
        String directory = (String) message.get("directory");
        
        try {
            // 在开始上传时创建 SFTP 通道
            Session sshSession = sshSessions.get(operatorId);
            if (sshSession != null && sshSession.isConnected()) {
                // 创建 SFTP 通道
                ChannelSftp sftpChannel = (ChannelSftp) sshSession.openChannel("sftp");
                sftpChannel.connect(3000);
                logger.info("SFTP通道已打开");
                
                try {
                    // 切换到指定目录
                    sftpChannel.cd(directory);
                    logger.info("SFTP已切换到目录: {}", directory);
                } catch (Exception e) {
                    logger.warn("无法切换到目录 {}，使用默认目录 /root", directory);
                    sftpChannel.cd("/root");
                }
                
                sftpChannels.put(operatorId, sftpChannel);
            }

            FileUploadState uploadState = new FileUploadState(filename, size);
            fileUploadStates.put(operatorId, uploadState);
            logger.info("开始接收文件上传: {}, 大小: {} bytes, 目录: {}", filename, size, directory);
        } catch (IOException e) {
            logger.error("创建文件上传状态失败", e);
        } catch (Exception e) {
            logger.error("创建SFTP通道失败", e);
        }
    }

    private void handleFileUploadEnd(String operatorId, Map<String, Object> message) {
        String filename = (String) message.get("filename");
        FileUploadState uploadState = fileUploadStates.remove(operatorId);
        
        if (uploadState != null) {
            ChannelSftp sftpChannel = sftpChannels.get(operatorId);
            if (sftpChannel != null && sftpChannel.isConnected()) {
                try {
                    // 直接上传到当前目录
                    sftpChannel.put(uploadState.getTempFile().getAbsolutePath(), filename);
                    logger.info("文件上传完成: {}", filename);
                } catch (Exception e) {
                    logger.error("文件上传失败: {}", filename, e);
                } finally {
                    // 清理临时文件
                    uploadState.cleanup();
                    // 关闭 SFTP 通道
                    sftpChannel.disconnect();
                    sftpChannels.remove(operatorId);
                    logger.info("SFTP通道已关闭");
                }
            }
        }
    }

    private void handleFileDownload(String operatorId, Map<String, Object> message, WebSocketSession session) {
        String filename = (String) message.get("filename");
        logger.info("开始下载文件: {}", filename);

        try {
            // 创建 SFTP 通道
            Session sshSession = sshSessions.get(operatorId);
            if (sshSession != null && sshSession.isConnected()) {
                ChannelSftp sftpChannel = (ChannelSftp) sshSession.openChannel("sftp");
                sftpChannel.connect(3000);
                logger.info("SFTP通道已打开");

                try {
                    // 获取文件大小
                    SftpATTRS attrs = sftpChannel.stat(filename);
                    long fileSize = attrs.getSize();
                    
                    // 发送下载开始消息
                    Map<String, Object> startMessage = new HashMap<>();
                    startMessage.put("type", "file_download_start");
                    startMessage.put("filename", filename);
                    startMessage.put("totalSize", fileSize);
                    session.sendMessage(new TextMessage(objectMapper.writeValueAsString(startMessage)));

                    // 读取文件内容
                    try (InputStream in = sftpChannel.get(filename)) {
                        byte[] buffer = new byte[1024 * 1024]; // 1MB 块大小
                        int bytesRead;
                        long totalBytesRead = 0;
                        
                        while ((bytesRead = in.read(buffer)) != -1) {
                            // 将块转换为Base64
                            String base64Chunk = Base64.getEncoder().encodeToString(
                                Arrays.copyOfRange(buffer, 0, bytesRead)
                            );
                            
                            // 发送块
                            Map<String, Object> chunkMessage = new HashMap<>();
                            chunkMessage.put("type", "file_download_chunk");
                            chunkMessage.put("content", base64Chunk);
                            chunkMessage.put("chunkSize", bytesRead);
                            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(chunkMessage)));
                            
                            totalBytesRead += bytesRead;
                            logger.debug("已发送 {} 字节，总进度: {}/{}", 
                                bytesRead, totalBytesRead, fileSize);
                        }
                        
                        // 发送下载完成消息
                        Map<String, Object> endMessage = new HashMap<>();
                        endMessage.put("type", "file_download_end");
                        session.sendMessage(new TextMessage(objectMapper.writeValueAsString(endMessage)));
                        
                        logger.info("文件下载完成: {}", filename);
                    }
                } finally {
                    sftpChannel.disconnect();
                    logger.info("SFTP通道已关闭");
                }
            }
        } catch (Exception e) {
            logger.error("文件下载失败: {}", filename, e);
            try {
                Map<String, String> errorMessage = new HashMap<>();
                errorMessage.put("type", "error");
                errorMessage.put("message", "文件下载失败: " + e.getMessage());
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(errorMessage)));
            } catch (Exception ex) {
                logger.error("发送错误消息失败", ex);
            }
        }
    }

    private void handleListFiles(String operatorId, Map<String, Object> message, WebSocketSession session) {
        String path = (String) message.get("path");
        logger.info("列出目录内容: {}", path);

        try {
            // 创建 SFTP 通道
            Session sshSession = sshSessions.get(operatorId);
            if (sshSession != null && sshSession.isConnected()) {
                ChannelSftp sftpChannel = (ChannelSftp) sshSession.openChannel("sftp");
                sftpChannel.connect(3000);
                logger.info("SFTP通道已打开");

                try {
                    // 切换到指定目录
                    sftpChannel.cd(path);
                    
                    // 获取目录内容
                    List<Map<String, Object>> files = new ArrayList<>();
                    for (Object entry : sftpChannel.ls(".")) {
                        ChannelSftp.LsEntry lsEntry = (ChannelSftp.LsEntry) entry;
                        Map<String, Object> fileInfo = new HashMap<>();
                        fileInfo.put("name", lsEntry.getFilename());
                        fileInfo.put("type", lsEntry.getAttrs().isDir() ? "directory" : "file");
                        if (!lsEntry.getAttrs().isDir()) {
                            fileInfo.put("size", lsEntry.getAttrs().getSize());
                            fileInfo.put("modified", new Date(lsEntry.getAttrs().getMTime() * 1000L).toString());
                        }
                        files.add(fileInfo);
                    }

                    // 发送文件列表
                    Map<String, Object> response = new HashMap<>();
                    response.put("type", "file_list");
                    response.put("path", path);
                    response.put("files", files);
                    session.sendMessage(new TextMessage(objectMapper.writeValueAsString(response)));
                    
                    logger.info("已发送目录内容: {}", path);
                } finally {
                    sftpChannel.disconnect();
                    logger.info("SFTP通道已关闭");
                }
            }
        } catch (Exception e) {
            logger.error("获取目录内容失败: {}", path, e);
            try {
                Map<String, String> errorMessage = new HashMap<>();
                errorMessage.put("type", "error");
                errorMessage.put("message", "获取目录内容失败: " + e.getMessage());
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(errorMessage)));
            } catch (Exception ex) {
                logger.error("发送错误消息失败", ex);
            }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String operatorId = extractOperatorId(session);
        logger.info("WebSocket连接已关闭，operatorId: {}, status: {}", operatorId, status);
        
        // 清理文件上传状态
        FileUploadState uploadState = fileUploadStates.remove(operatorId);
        if (uploadState != null) {
            uploadState.cleanup();
        }

        // 关闭SFTP通道
        ChannelSftp sftpChannel = sftpChannels.remove(operatorId);
        if (sftpChannel != null) {
            sftpChannel.disconnect();
            logger.info("SFTP通道已关闭");
        }

        // 关闭SSH通道
        Channel channel = sshChannels.remove(operatorId);
        if (channel != null) {
            channel.disconnect();
            logger.info("SSH通道已关闭");
        }

        // 关闭SSH会话
        Session sshSession = sshSessions.remove(operatorId);
        if (sshSession != null) {
            sshSession.disconnect();
            logger.info("SSH会话已关闭");
        }

        // 移除WebSocket会话
        webSocketSessions.remove(operatorId);
    }

    private String extractOperatorId(WebSocketSession session) {
        String path = session.getUri().getPath();
        return path.substring(path.lastIndexOf('/') + 1);
    }

    private static class FileUploadState {
        private final String filename;
        private final long totalSize;
        private final File tempFile;
        private final FileOutputStream outputStream;
        private long receivedSize;

        public FileUploadState(String filename, long totalSize) throws IOException {
            this.filename = filename;
            this.totalSize = totalSize;
            this.tempFile = File.createTempFile("upload_", "_" + filename);
            this.outputStream = new FileOutputStream(tempFile);
            this.receivedSize = 0;
        }

        public void writeChunk(byte[] chunk) throws IOException {
            outputStream.write(chunk);
            receivedSize += chunk.length;
        }

        public File getTempFile() {
            return tempFile;
        }

        public void cleanup() {
            try {
                outputStream.close();
                tempFile.delete();
            } catch (IOException e) {
                logger.error("清理临时文件失败", e);
            }
        }
    }
} 