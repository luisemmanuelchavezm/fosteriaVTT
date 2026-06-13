package com.fosteriaVTT.fosteriaVTT_backend.configuration;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtUtilTest {

    private static final String SIGNING_FIXTURE = "abcdefghijklmnopqrstuvwxyz012345";

    @Test
    void generaYValidaUnTokenCorrectamente() {
        JwtUtil jwtUtil = new JwtUtil(SIGNING_FIXTURE, 3_600_000);
        UserDetails userDetails = new User("daria", "pw", List.of());

        String token = jwtUtil.generateToken(userDetails);

        assertEquals("daria", jwtUtil.extractUsername(token));
        assertFalse(jwtUtil.isTokenExpired(token));
        assertTrue(jwtUtil.validateToken(token, userDetails));
    }

    @Test
    void invalidaElTokenSiPerteneceAOtroUsuario() {
        JwtUtil jwtUtil = new JwtUtil(SIGNING_FIXTURE, 3_600_000);
        UserDetails sourceUser = new User("daria", "pw", List.of());
        UserDetails otherUser = new User("sai", "pw", List.of());

        String token = jwtUtil.generateToken(sourceUser);

        assertFalse(jwtUtil.validateToken(token, otherUser));
    }
}