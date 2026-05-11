package com.fosteriaVTT.fosteriaVTT_backend.Dibujo;

import com.fosteriaVTT.fosteriaVTT_backend.dto.BorrarDibujoWsRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.CrearDibujoWsRequest;
import java.security.Principal;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Controller
public class DibujoWebSocketController {

    private final DibujoService dibujoService;

    public DibujoWebSocketController(DibujoService dibujoService) {
        this.dibujoService = dibujoService;
    }

    @MessageMapping("/campanas/{campañaId}/dibujos/crear")
    public void crearDibujo(
            @DestinationVariable Long campañaId,
            CrearDibujoWsRequest request,
            Principal principal
    ) {
        String username = principal == null ? null : principal.getName();
        if (username == null || username.isBlank()) {
            throw new ResponseStatusException(UNAUTHORIZED, "Usuario no autenticado");
        }

        dibujoService.crearYEmitirDibujo(campañaId, request, username);
    }

    @MessageMapping("/campanas/{campañaId}/dibujos/borrar")
    public void borrarDibujo(
            @DestinationVariable Long campañaId,
            BorrarDibujoWsRequest request,
            Principal principal
    ) {
        String username = principal == null ? null : principal.getName();
        if (username == null || username.isBlank()) {
            throw new ResponseStatusException(UNAUTHORIZED, "Usuario no autenticado");
        }

        dibujoService.borrarYEmitirDibujo(campañaId, request, username);
    }
}
