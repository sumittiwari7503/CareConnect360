package com.careconnect360.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/health")
public class HealthController {

    @Value("${spring.profiles.active:default}")
    private String activeProfile;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getHealthStatus() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "platform", "CareConnect360",
                "projectId", "P_013",
                "activeProfile", activeProfile,
                "timestamp", Instant.now().toString(),
                "stack", "Angular + Java Spring Boot + Oracle DB"
        ));
    }
}
