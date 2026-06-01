package com.fosteriaVTT.fosteriaVTT_backend.Personaje;

import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.HabilidadRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Objeto.ObjetoRepository;
import com.fosteriaVTT.fosteriaVTT_backend.dto.morkborg.MBRasgoClaseResponse;
import java.util.ArrayList;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/mb")
public class MorkBorgCatalogoController {

    private static final List<String> CLASS_OBJECT_TAGS = List.of(
            "ArmaEspecial", "ItemEspecial", "DesertorItemIdx", "RealezaItemIdx",
            "SacerdoteItemIdx", "ErmitanoEspecialidadIdx"
    );

    private final HabilidadRepository habilidadRepository;
    private final ObjetoRepository objetoRepository;

    public MorkBorgCatalogoController(HabilidadRepository habilidadRepository,
                                       ObjetoRepository objetoRepository) {
        this.habilidadRepository = habilidadRepository;
        this.objetoRepository = objetoRepository;
    }

    @GetMapping("/rasgos-clase")
    public List<MBRasgoClaseResponse> getRasgosClase() {
        List<MBRasgoClaseResponse> result = new ArrayList<>();

        // Rasgos de clase MB
        habilidadRepository
                .findByTagsContainingIgnoreCaseOrderByNombreAsc("MORK_BORG,Habilidad")
                .forEach(h -> result.add(
                        new MBRasgoClaseResponse(h.getId(), h.getNombre(), h.getDescripcion(), h.getFormula(), h.getTags(), "HABILIDAD")));

        // Pergaminos MB (impuros y sagrados)
        habilidadRepository
                .findByTagsContainingIgnoreCaseOrderByNombreAsc("MORK_BORG,Pergamino")
                .forEach(h -> {
                    boolean already = result.stream().anyMatch(r -> r.id().equals(h.getId()) && "HABILIDAD".equals(r.tipo()));
                    if (!already) {
                        result.add(new MBRasgoClaseResponse(h.getId(), h.getNombre(), h.getDescripcion(), h.getFormula(), h.getTags(), "HABILIDAD"));
                    }
                });

        // Objetos de clase MB (armas especiales, items de realeza, sacerdote, etc.)
        for (String tag : CLASS_OBJECT_TAGS) {
            objetoRepository
                    .findByIndiceContainingIgnoreCaseOrderByIdAsc(tag)
                    .stream()
                    .filter(o -> o.getIndice() != null && o.getIndice().contains("MORK_BORG"))
                    .forEach(o -> {
                        boolean already = result.stream().anyMatch(r -> r.id().equals(o.getId()) && "OBJETO".equals(r.tipo()));
                        if (!already) {
                            result.add(new MBRasgoClaseResponse(o.getId(), o.getNombre(), o.getDescripcion(), o.getFormula(), o.getIndice(), "OBJETO"));
                        }
                    });
        }

        return result;
    }
}
