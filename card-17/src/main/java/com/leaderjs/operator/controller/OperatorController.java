package com.leaderjs.operator.controller;

import com.leaderjs.operator.model.Operator;
import com.leaderjs.operator.repository.OperatorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api")
public class OperatorController {

    @Autowired
    private OperatorRepository operatorRepository;

    // 获取所有operators
    @GetMapping("/operators")
    public List<Operator> getAllOperators(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String project,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String provider) {
        
        if (category != null && project != null) {
            return operatorRepository.findByCategoryAndProject(category, project);
        }
        if (category != null) {
            return operatorRepository.findByCategory(category);
        }
        if (project != null) {
            return operatorRepository.findByProject(project);
        }
        if (search != null) {
            return operatorRepository.findByNameContaining(search);
        }
        if (provider != null) {
            return operatorRepository.findByProvider(provider);
        }
        
        return operatorRepository.findAll();
    }

    // 获取单个operator
    @GetMapping("/operators/{id}")
    public ResponseEntity<Operator> getOperatorById(@PathVariable String id) {
        return operatorRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 创建新operator
    @PostMapping("/operators")
    public Operator createOperator(@RequestBody Operator operator) {
        // 设置创建时间
        String currentTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        operator.setCreatedAt(currentTime);
        return operatorRepository.save(operator);
    }

    // 更新operator
    @PutMapping("/operators/{id}")
    public ResponseEntity<Operator> updateOperator(@PathVariable String id, @RequestBody Operator operatorDetails) {
        return operatorRepository.findById(id)
                .map(existingOperator -> {
                    existingOperator.setMyId(operatorDetails.getMyId());
                    existingOperator.setName(operatorDetails.getName());
                    existingOperator.setProvider(operatorDetails.getProvider());
                    existingOperator.setDescription(operatorDetails.getDescription());
                    existingOperator.setCategory(operatorDetails.getCategory());
                    existingOperator.setProject(operatorDetails.getProject());
                    existingOperator.setLogo(operatorDetails.getLogo());
                    existingOperator.setUrl(operatorDetails.getUrl());
                    return ResponseEntity.ok(operatorRepository.save(existingOperator));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // 删除operator
    @DeleteMapping("/operators/{id}")
    public ResponseEntity<?> deleteOperator(@PathVariable String id) {
        return operatorRepository.findById(id)
                .map(operator -> {
                    operatorRepository.delete(operator);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
} 