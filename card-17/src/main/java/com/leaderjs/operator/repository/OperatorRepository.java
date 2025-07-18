package com.leaderjs.operator.repository;

import com.leaderjs.operator.model.Operator;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OperatorRepository extends MongoRepository<Operator, String> {
    
    // 根据分类和项目查询
    List<Operator> findByCategoryAndProject(String category, String project);
    
    // 根据分类查询
    List<Operator> findByCategory(String category);
    
    // 根据项目查询
    List<Operator> findByProject(String project);
    
    // 根据名称模糊查询
    @Query("{ 'name' : { $regex: ?0, $options: 'i' } }")
    List<Operator> findByNameContaining(String name);
    
    // 根据提供商查询
    List<Operator> findByProvider(String provider);

    Optional<Operator> findByMyId(String myId);
} 