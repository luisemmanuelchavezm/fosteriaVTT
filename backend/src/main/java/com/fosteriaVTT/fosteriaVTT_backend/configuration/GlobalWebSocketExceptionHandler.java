package com.fosteriaVTT.fosteriaVTT_backend.configuration;

import com.fosteriaVTT.fosteriaVTT_backend.dto.WebSocketErrorResponse;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.web.server.ResponseStatusException;

@ControllerAdvice
public class GlobalWebSocketExceptionHandler {

    @MessageExceptionHandler(ResponseStatusException.class)
    @SendToUser("/queue/errors")
    public WebSocketErrorResponse handleResponseStatusException(ResponseStatusException exception) {
        int statusCode = exception.getStatusCode().value();
        String reason = exception.getReason() == null ? "Error de validación" : exception.getReason();
        return new WebSocketErrorResponse(statusCode, exception.getStatusCode().toString(), reason);
    }

    @MessageExceptionHandler(Exception.class)
    @SendToUser("/queue/errors")
    public WebSocketErrorResponse handleGenericException(Exception exception) {
        return new WebSocketErrorResponse(500, "INTERNAL_SERVER_ERROR", "Ha ocurrido un error interno");
    }
}
