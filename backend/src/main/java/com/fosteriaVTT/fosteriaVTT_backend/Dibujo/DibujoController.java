package com.fosteriaVTT.fosteriaVTT_backend.Dibujo;

import com.fosteriaVTT.fosteriaVTT_backend.dto.DibujoResponse;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/campanas/{campaniaId}/dibujos")
public class DibujoController {

    private final DibujoService dibujoService;

    public DibujoController(DibujoService dibujoService) {
        this.dibujoService = dibujoService;
    }

    @GetMapping
    public List<DibujoResponse> obtenerDibujos(
            @PathVariable("campaniaId") Long campañaId,
            @RequestParam("pestanaId") Long pestañaId,
            Authentication authentication
    ) {
        return dibujoService.obtenerDibujos(campañaId, pestañaId, authentication.getName());
    }
}
