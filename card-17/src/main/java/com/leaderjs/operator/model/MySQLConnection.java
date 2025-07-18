package com.leaderjs.operator.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document(collection = "mysql_connections")
public class MySQLConnection {
    @Id
    private String id;
    private String name;
    private String host;
    private int port;
    private String username;
    private String password;
    private String database;
    private String description;
    private boolean active;
    private String createdAt;
    private String updatedAt;
} 