package com.leaderjs.operator.controller;

import com.leaderjs.operator.model.Project;
import com.leaderjs.operator.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ProjectController {

    @Autowired
    private ProjectRepository projectRepository;

    // 查所有
    @GetMapping("/projects")
    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }

    // 增
    @PostMapping("/project")
    public ResponseEntity<Project> createProject(@RequestBody Project project) {
        Project savedProject = projectRepository.save(project);
        return ResponseEntity.ok(savedProject);
    }
    // 删, 暂时用不到？
    @DeleteMapping("/project/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable String id) {
        projectRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
    // 改，好像用不到？
    //@PutMapping("/project/{id}")



} 