package com.fosteriaVTT.fosteriaVTT_backend.configuration;

import com.fosteriaVTT.fosteriaVTT_backend.dto.WebSocketErrorResponse;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.*;

class GlobalWebSocketExceptionHandlerTest {

    private final GlobalWebSocketExceptionHandler handler = new GlobalWebSocketExceptionHandler();

    @Test
    void manejaResponseStatusExceptionConReason() {
        ResponseStatusException ex = new ResponseStatusException(HttpStatus.BAD_REQUEST, "Datos inválidos");

        WebSocketErrorResponse response = handler.handleResponseStatusException(ex);

        assertEquals(400, response.status());
        assertEquals("Datos inválidos", response.message());
        assertNotNull(response.error());
    }

    @Test
    void manejaResponseStatusExceptionSinReason() {
        ResponseStatusException ex = new ResponseStatusException(HttpStatus.FORBIDDEN);

        WebSocketErrorResponse response = handler.handleResponseStatusException(ex);

        assertEquals(403, response.status());
        assertEquals("Error de validación", response.message());
    }

    @Test
    void manejaExcepcionGenericaDevuelve500() {
        Exception ex = new RuntimeException("Error inesperado");

        WebSocketErrorResponse response = handler.handleGenericException(ex);

        assertEquals(500, response.status());
        assertEquals("INTERNAL_SERVER_ERROR", response.error());
        assertEquals("Ha ocurrido un error interno", response.message());
    }

    @Test
    void manejaUnauthorizedException() {
        ResponseStatusException ex = new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No autenticado");

        WebSocketErrorResponse response = handler.handleResponseStatusException(ex);

        assertEquals(401, response.status());
        assertEquals("No autenticado", response.message());
    }

    @Test
    void manejaNotFoundExceptionConReason() {
        ResponseStatusException ex = new ResponseStatusException(HttpStatus.NOT_FOUND, "Recurso no encontrado");

        WebSocketErrorResponse response = handler.handleResponseStatusException(ex);

        assertEquals(404, response.status());
        assertEquals("Recurso no encontrado", response.message());
    }
}
