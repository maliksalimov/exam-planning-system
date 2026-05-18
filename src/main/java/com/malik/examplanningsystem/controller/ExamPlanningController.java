package com.malik.examplanningsystem.controller;

import com.malik.examplanningsystem.service.ExamPlanningService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@AllArgsConstructor
@RequestMapping("/api/admin/exam-planning")
public class ExamPlanningController {

    private final ExamPlanningService examPlanningService;

    @PostMapping("/plan/{examId}")
    public ResponseEntity<Map<String, Object>> planExam(
            @PathVariable Long examId,
            @RequestParam(name = "dryRun", defaultValue = "false") boolean dryRun,
            @RequestBody List<Long> studentIds) {
        return ResponseEntity.ok(examPlanningService.planExam(examId, studentIds, dryRun));
    }

    @DeleteMapping("/plan/{examId}")
    public ResponseEntity<Map<String, Object>> resetPlan(@PathVariable Long examId) {
        return ResponseEntity.ok(examPlanningService.resetExamPlan(examId));
    }

    @GetMapping("/conflicts")
    public ResponseEntity<List<Map<String, Object>>> getAllConflicts() {
        return ResponseEntity.ok(examPlanningService.detectAllConflicts());
    }
}
