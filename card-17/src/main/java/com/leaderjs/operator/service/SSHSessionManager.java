package com.leaderjs.operator.service;

import com.jcraft.jsch.Channel;
import com.jcraft.jsch.JSch;
import com.jcraft.jsch.Session;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SSHSessionManager {
    private final Map<String, Session> sessions = new ConcurrentHashMap<>();
    private final Map<String, Channel> channels = new ConcurrentHashMap<>();

    public Session createSession(String operatorId, String host, int port, String username, String password) throws Exception {
        JSch jsch = new JSch();
        Session session = jsch.getSession(username, host, port);
        session.setPassword(password);
        session.setConfig("StrictHostKeyChecking", "no");
        session.connect(30000);
        sessions.put(operatorId, session);
        return session;
    }

    public Channel createChannel(String operatorId) throws Exception {
        Session session = sessions.get(operatorId);
        if (session == null) {
            throw new IllegalStateException("No active session for operator: " + operatorId);
        }

        Channel channel = session.openChannel("shell");
        channel.connect(3000);
        channels.put(operatorId, channel);
        return channel;
    }

    public void closeSession(String operatorId) {
        Channel channel = channels.remove(operatorId);
        if (channel != null) {
            channel.disconnect();
        }

        Session session = sessions.remove(operatorId);
        if (session != null) {
            session.disconnect();
        }
    }

    public Channel getChannel(String operatorId) {
        return channels.get(operatorId);
    }

    public Session getSession(String operatorId) {
        return sessions.get(operatorId);
    }
} 