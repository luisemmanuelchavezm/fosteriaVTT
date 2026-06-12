package com.fosteriaVTT.fosteriaVTT_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RegisterRequest {

    @NotBlank(message = "username is required")
    @Size(min = 3, max = 100, message = "username must be between 3 and 100 characters")
    private String username;

    @NotBlank(message = "email is required")
    @Size(max = 100, message = "email must be at most 100 characters")
    private String email;

    @NotBlank(message = "password is required")
    @Size(min = 8, max = 100, message = "password must be between 8")
    private String password;

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
