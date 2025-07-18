package com.leaderjs.operator.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.web.socket.server.standard.ServletServerContainerFactoryBean;
import org.springframework.context.annotation.Bean;
import com.leaderjs.operator.controller.SSHWebSocketController;
import com.leaderjs.operator.controller.MySQLWebSocketController;
import org.springframework.beans.factory.annotation.Autowired;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final SSHWebSocketController sshWebSocketController;
    private final MySQLWebSocketController mysqlWebSocketController;

    public WebSocketConfig(SSHWebSocketController sshWebSocketController, 
                          MySQLWebSocketController mysqlWebSocketController) {
        this.sshWebSocketController = sshWebSocketController;
        this.mysqlWebSocketController = mysqlWebSocketController;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(sshWebSocketController, "/ws/ssh/{operatorId}")
                .setAllowedOrigins("*");
        registry.addHandler(mysqlWebSocketController, "/ws/mysql/{id}")
                .setAllowedOrigins("*");
    }

    @Bean
    public ServletServerContainerFactoryBean createWebSocketContainer() {
        ServletServerContainerFactoryBean container = new ServletServerContainerFactoryBean();
        // 设置最大消息大小为 10MB
        container.setMaxTextMessageBufferSize(10 * 1024 * 1024);
        container.setMaxBinaryMessageBufferSize(10 * 1024 * 1024);
        return container;
    }
} 