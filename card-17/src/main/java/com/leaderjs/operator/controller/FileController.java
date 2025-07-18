package com.leaderjs.operator.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import java.io.File;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class FileController {

    @PostMapping("/local-files")
    public ResponseEntity<?> listLocalFiles(@RequestBody Map<String, String> request) {
        String path = request.get("path");
        File directory = new File(path);
        
        if (!directory.exists() || !directory.isDirectory()) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "目录不存在");
            return ResponseEntity.badRequest().body(error);
        }

        List<Map<String, Object>> files = new ArrayList<>();
        File[] fileList = directory.listFiles();
        
        if (fileList != null) {
            for (File file : fileList) {
                Map<String, Object> fileInfo = new HashMap<>();
                fileInfo.put("name", file.getName());
                fileInfo.put("type", file.isDirectory() ? "directory" : "file");
                if (!file.isDirectory()) {
                    fileInfo.put("size", file.length());
                    fileInfo.put("modified", file.lastModified());
                }
                files.add(fileInfo);
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("files", files);
        return ResponseEntity.ok(response);
    }
} 