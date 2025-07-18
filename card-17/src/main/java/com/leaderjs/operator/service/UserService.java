package com.leaderjs.operator.service;

import com.leaderjs.operator.model.User;
import org.springframework.security.core.userdetails.UserDetailsService;

public interface UserService extends UserDetailsService {
    User save(User user);
    boolean existsByUsername(String username);
} 