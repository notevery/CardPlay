package com.leaderjs.operator.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;

@Component
public class JwtTokenProvider {

    @Value("${app.jwtSecret}")
    private String jwtSecret;

    @Value("${app.jwtExpirationInMs}")
    private int jwtExpirationInMs;

    private SecretKey key;

    @PostConstruct
    public void init() {
        // 使用 Base64 解码配置的密钥
        byte[] keyBytes = Base64.getDecoder().decode(jwtSecret);
        // 使用 Keys.hmacShaKeyFor 创建安全的密钥
        this.key = Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationInMs);

        return Jwts.builder()
                .setSubject(userDetails.getUsername())
                .setIssuedAt(new Date())
                .setExpiration(expiryDate)
                .signWith(key)
                .compact();
    }

    public String getUsernameFromJWT(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();

        return claims.getSubject();
    }

    public boolean validateToken(String authToken) {
        try {
            Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(authToken);
            return true;
        } catch (SignatureException ex) {
            // 无效的 JWT 签名
            return false;
        } catch (MalformedJwtException ex) {
            // 无效的 JWT token
            return false;
        } catch (ExpiredJwtException ex) {
            // 过期的 JWT token
            return false;
        } catch (UnsupportedJwtException ex) {
            // 不支持的 JWT token
            return false;
        } catch (IllegalArgumentException ex) {
            // JWT claims string 为空
            return false;
        }
    }
} 