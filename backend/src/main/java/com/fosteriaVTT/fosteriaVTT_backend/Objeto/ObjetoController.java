package com.fosteriaVTT.fosteriaVTT_backend.Objeto;

import com.fosteriaVTT.fosteriaVTT_backend.dto.ObjetoCatalogoResponse;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@RestController
@RequestMapping("/api/objetos")
public class ObjetoController {

    private final ObjetoService objetoService;

    public ObjetoController(ObjetoService objetoService) {
        this.objetoService = objetoService;
    }

    @GetMapping
    public List<ObjetoCatalogoResponse> buscarObjetos(
            @RequestParam(required = false) String nombre,
            @RequestParam(required = false) String tipo,
            Authentication authentication
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(UNAUTHORIZED, "Usuario no autenticado");
        }

        return objetoService.buscarObjetos(nombre, tipo, authentication.getName());
    }
}