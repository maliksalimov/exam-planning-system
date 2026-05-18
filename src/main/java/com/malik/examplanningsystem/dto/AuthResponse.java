package com.malik.examplanningsystem.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
@Schema(description = "JWT authentication response")
public class AuthResponse {

    @Schema(description = "JWT Bearer token to include in Authorization header", example = "eyJhbGciOiJIUzI1NiJ9...")
    private String token;
}
