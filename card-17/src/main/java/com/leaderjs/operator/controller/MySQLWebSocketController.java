package com.leaderjs.operator.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.leaderjs.operator.model.Operator;
import com.leaderjs.operator.repository.OperatorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Controller
public class MySQLWebSocketController extends TextWebSocketHandler {
    private static final Logger logger = LoggerFactory.getLogger(MySQLWebSocketController.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private OperatorRepository operatorRepository;

    // 存储WebSocket会话和对应的MySQL连接
    private final Map<String, WebSocketSession> webSocketSessions = new ConcurrentHashMap<>();
    private final Map<String, Connection> mysqlConnections = new ConcurrentHashMap<>();

    private String extractConnectionId(WebSocketSession session) {
        String path = session.getUri().getPath();
        String[] segments = path.split("/");
        if (segments.length >= 3) {
            String id = segments[segments.length - 1];
            logger.info("从路径中提取的ID: {}", id);
            return id;
        }
        throw new IllegalArgumentException("无法从WebSocket路径中提取ID");
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String operatorId = extractConnectionId(session);
        if (operatorId == null || operatorId.trim().isEmpty()) {
            throw new IllegalArgumentException("Operator ID 不能为空");
        }
        
        logger.info("WebSocket连接已建立，operatorId: {}", operatorId);
        webSocketSessions.put(operatorId, session);

        // 获取Operator信息
        Optional<Operator> operatorOpt = operatorRepository.findById(operatorId);
        if (!operatorOpt.isPresent()) {
            throw new RuntimeException("找不到Operator: " + operatorId);
        }
        
        Operator operator = operatorOpt.get();
        logger.info("找到Operator: {}", operator.getName());

        try {
            // 建立MySQL连接
            String url = String.format("jdbc:mysql://%s:%d?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC",
                    operator.getHost(),
                    operator.getPort());
            
            Connection conn = DriverManager.getConnection(
                url,
                operator.getUsername(),
                operator.getPassword()
            );
            
            logger.info("MySQL连接已建立");
            mysqlConnections.put(operatorId, conn);
            
            // 发送连接成功消息
            Map<String, Object> response = new HashMap<>();
            response.put("type", "connection_established");
            response.put("message", "MySQL连接已建立");
            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(response)));
            
        } catch (Exception e) {
            logger.error("建立MySQL连接时发生错误", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("type", "error");
            errorResponse.put("message", "Failed to establish MySQL connection: " + e.getMessage());
            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(errorResponse)));
            session.close(CloseStatus.SERVER_ERROR.withReason("Failed to establish MySQL connection: " + e.getMessage()));
        }
    }

    @Override
    public void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String operatorId = extractConnectionId(session);
        Connection conn = mysqlConnections.get(operatorId);
        
        if (conn == null || conn.isClosed()) {
            throw new RuntimeException("MySQL连接未建立或已关闭");
        }

        String sql = message.getPayload();
        logger.info("收到SQL查询: {}", sql);

        try (Statement stmt = conn.createStatement()) {
            boolean isQuery = stmt.execute(sql);
            
            Map<String, Object> response = new HashMap<>();
            response.put("type", "query_result");
            
            if (isQuery) {
                // 处理查询结果
                try (ResultSet rs = stmt.getResultSet()) {
                    ResultSetMetaData metaData = rs.getMetaData();
                    int columnCount = metaData.getColumnCount();
                    
                    // 获取列名
                    List<String> columns = new ArrayList<>();
                    for (int i = 1; i <= columnCount; i++) {
                        columns.add(metaData.getColumnName(i));
                    }
                    
                    // 获取数据行
                    List<List<Object>> rows = new ArrayList<>();
                    while (rs.next()) {
                        List<Object> row = new ArrayList<>();
                        for (int i = 1; i <= columnCount; i++) {
                            row.add(rs.getObject(i));
                        }
                        rows.add(row);
                    }
                    
                    response.put("columns", columns);
                    response.put("rows", rows);
                }
            } else {
                // 处理更新操作
                int affectedRows = stmt.getUpdateCount();
                response.put("affected_rows", affectedRows);
            }
            
            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(response)));
            
        } catch (Exception e) {
            logger.error("执行SQL查询时发生错误", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("type", "error");
            errorResponse.put("message", "Failed to execute SQL query: " + e.getMessage());
            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(errorResponse)));
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String connectionId = extractConnectionId(session);
        logger.info("WebSocket连接已关闭，connectionId: {}, status: {}", connectionId, status);
        
        // 关闭MySQL连接
        Connection conn = mysqlConnections.remove(connectionId);
        if (conn != null && !conn.isClosed()) {
            conn.close();
            logger.info("MySQL连接已关闭");
        }
        
        webSocketSessions.remove(connectionId);
    }
} 