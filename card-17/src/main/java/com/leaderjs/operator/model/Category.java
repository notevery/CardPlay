package com.leaderjs.operator.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "categories")
public class Category {
    @Id
    private String id;
    private String myId;
    private String name;

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }
    public String getMyId() {
        return myId;
    }
    public void setMyId(String myId) {
        this.myId = myId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

} 