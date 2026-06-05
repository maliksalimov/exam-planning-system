package com.malik.examplanningsystem.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Public registration request — always creates a STUDENT account")
public class RegisterRequest {

    @NotBlank(message = "Username cannot be blank")
    @Size(min = 3, max = 50)
    @Schema(description = "Unique username (3–50 characters)", example = "john_doe")
    private String username;

    @NotBlank(message = "Password cannot be blank")
    @Size(min = 6)
    @Schema(description = "Password (minimum 6 characters)", example = "secret123")
    private String password;
}
