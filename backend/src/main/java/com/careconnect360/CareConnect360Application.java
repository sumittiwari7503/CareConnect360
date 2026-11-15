package com.careconnect360;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class CareConnect360Application {

    public static void main(String[] args) {
        System.setProperty("app.demo.seed-dev-personas", "true");
        SpringApplication.run(CareConnect360Application.class, args);
    }
}
