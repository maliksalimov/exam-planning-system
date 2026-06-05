package com.malik.examplanningsystem;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ExamPlanningSystemApplication {

    public static void main(String[] args) {
        SpringApplication.run(ExamPlanningSystemApplication.class, args);
    }
}
