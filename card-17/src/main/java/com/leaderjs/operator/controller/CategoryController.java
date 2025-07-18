package com.leaderjs.operator.controller;

import com.leaderjs.operator.model.Category;
import com.leaderjs.operator.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
@RestController
@RequestMapping("/api")
public class CategoryController {

    private static final Logger logger = LoggerFactory.getLogger(SSHWebSocketController.class);


    @Autowired
    private CategoryRepository categoryRepository;

    // 获取所有分类
    @GetMapping("/categories")
    public List<Category> getAllCategories() {
        System.out.println("system LOG: 获取所有分类");
        logger.info("LoggerFactory LOG: 获取所有分类");

        return categoryRepository.findAll();
    }

    // 获取单个分类
    @GetMapping("/categories/{id}")
    public ResponseEntity<Category> getCategoryById(@PathVariable String id) {
        return categoryRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 创建新分类
    @PostMapping("/categories")
    public Category createCategory(@RequestBody Category category) {
        return categoryRepository.save(category);
    }

    // 更新分类
    @PutMapping("/categories/{id}")
    public ResponseEntity<Category> updateCategory(@PathVariable String id, @RequestBody Category categoryDetails) {
        return categoryRepository.findById(id)
                .map(existingCategory -> {
                    existingCategory.setName(categoryDetails.getName());
                    return ResponseEntity.ok(categoryRepository.save(existingCategory));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // 删除分类
    @DeleteMapping("/categories/{id}")
    public ResponseEntity<?> deleteCategory(@PathVariable String id) {
        return categoryRepository.findById(id)
                .map(category -> {
                    categoryRepository.delete(category);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
} 