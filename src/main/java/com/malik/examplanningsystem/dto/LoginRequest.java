package com.malik.examplanningsystem.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Schema(description = "Login credentials")
public class LoginRequest {

    @NotBlank(message = "Username cannot be blank")
    @Schema(description = "Username of the account", example = "admin")
    private String username;

    @NotBlank(message = "Password cannot be blank")
    @Schema(description = "Password of the account", example = "secret123")
    private String password;
}
