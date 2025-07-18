package com.leaderjs.operator.repository;

import com.leaderjs.operator.model.MySQLConnection;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface MySQLConnectionRepository extends MongoRepository<MySQLConnection, String> {
} 