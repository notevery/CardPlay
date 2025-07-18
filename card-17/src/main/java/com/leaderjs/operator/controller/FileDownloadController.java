package com.leaderjs.operator.controller;

import com.jcraft.jsch.ChannelSftp;
import com.jcraft.jsch.JSch;
import com.jcraft.jsch.Session;
import com.leaderjs.operator.model.Operator;
import com.leaderjs.operator.repository.OperatorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.http.HttpServletRequest;
import java.io.InputStream;

@RestController
@RequestMapping("/api")
public class FileDownloadController {
    private static final Logger logger = LoggerFactory.getLogger(FileDownloadController.class);

    @Autowired
    private OperatorRepository operatorRepository;

    @GetMapping("/download")
    public ResponseEntity<InputStreamResource> downloadFile(
            @RequestParam String path,
            HttpServletRequest request) {
        try {
            // 从请求中获取 operatorId
            String operatorId = request.getHeader("X-Operator-Id");
            if (operatorId == null) {
                return ResponseEntity.badRequest().build();
            }

            // 获取 Operator 信息
            Operator operator = operatorRepository.findById(operatorId)
                    .orElseThrow(() -> new RuntimeException("Operator not found: " + operatorId));

            // 建立 SFTP 连接
            JSch jsch = new JSch();
            Session session = jsch.getSession(
                operator.getUsername(),
                operator.getHost(),
                operator.getPort()
            );
            session.setPassword(operator.getPassword());
            session.setConfig("StrictHostKeyChecking", "no");
            session.connect(30000);

            ChannelSftp sftpChannel = (ChannelSftp) session.openChannel("sftp");
            sftpChannel.connect(3000);

            try {
                // 获取文件输入流
                InputStream inputStream = sftpChannel.get(path);
                
                // 获取文件名
                String filename = path.substring(path.lastIndexOf('/') + 1);
                
                // 设置响应头
                HttpHeaders headers = new HttpHeaders();
                headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename);
                headers.add(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate");
                headers.add(HttpHeaders.PRAGMA, "no-cache");
                headers.add(HttpHeaders.EXPIRES, "0");

                // 返回文件流
                return ResponseEntity.ok()
                    .headers(headers)
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(new InputStreamResource(inputStream));
            } finally {
                sftpChannel.disconnect();
                session.disconnect();
            }
        } catch (Exception e) {
            logger.error("文件下载失败: {}", path, e);
            return ResponseEntity.internalServerError().build();
        }
    }
} 