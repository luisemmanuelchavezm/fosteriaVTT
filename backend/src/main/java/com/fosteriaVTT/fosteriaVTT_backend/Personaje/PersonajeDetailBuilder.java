package com.fosteriaVTT.fosteriaVTT_backend.Personaje;

import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.Habilidad;
import com.fosteriaVTT.fosteriaVTT_backend.Mochila.Mochila;
import com.fosteriaVTT.fosteriaVTT_backend.Mochila.MochilaService;
import com.fosteriaVTT.fosteriaVTT_backend.Objeto.Objeto;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.dndUtils.DndCombatUtils;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.dndUtils.DndCharacterStatsUtils;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.dndUtils.DndWeaponProficiencies;
import com.fosteriaVTT.fosteriaVTT_backend.common.TagUtils;
import com.fosteriaVTT.fosteriaVTT_backend.dto.HabilidadResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.PersonajeDetalleResponse;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
class PersonajeDetailBuilder {

    private final MochilaService mochilaService;
    private final DndCombatUtils dndCombatUtils;
    private final DndCharacterStatsUtils dndCharacterStatsUtils;

    PersonajeDetailBuilder(
            MochilaService mochilaService,
            DndCombatUtils dndCombatUtils,
            DndCharacterStatsUtils dndCharacterStatsUtils
    ) {
        this.mochilaService = mochilaService;
        this.dndCombatUtils = dndCombatUtils;
        this.dndCharacterStatsUtils = dndCharacterStatsUtils;
    }

    PersonajeDetalleResponse buildDetalleEnemigo(
            Personaje personaje,
            Map<String, Integer> estadisticas,
            String tipo,
            Long personajeId
    ) {
        Map<Long, Mochila> mochilaByObjetoId =
                mochilaService.obtenerMochilaPersonaje(personajeId).stream()
                        .filter(item -> item.getObjeto() != null && item.getObjeto().getId() != null)
                        .collect(java.util.stream.Collectors.toMap(
                                item -> item.getObjeto().getId(),
                                item -> item,
                                (a, b) -> a
                        ));

        return new PersonajeDetalleResponse(
                personaje.getId(),
                personaje.getNombre(),
                personaje.getRetrato(),
                personaje.getBiografia(),
                personaje.getSistemaDeJuego().getDisplayName(),
                null,
                null,
                List.of(),
                null,
                estadisticas,
                personaje.getHabilidades().stream()
                        .map(h -> {
                            Integer bonif = resolverBonificacionHabilidadEnemigo(h, mochilaByObjetoId);
                            return new HabilidadResponse(
                                    h.getId(),
                                    h.getNombre(),
                                    bonif,
                                    h.getFormula(),
                                    h.getDescripcion(),
                                    h.getTags()
                            );
                        })
                        .toList(),
                mochilaService.obtenerItemsPersonaje(personajeId),
                personaje.getUsado(),
                tipo,
                TagUtils.extractTagValue(personaje.getTags(), "vd"),
                personaje.getUsuario() != null ? personaje.getUsuario().getUsername() : null,
                personaje.getTags()
        );
    }

    PersonajeDetalleResponse buildDetallePersonaje(
            Personaje personaje,
            Map<String, Integer> estadisticas,
            String tipo,
            Long personajeId
    ) {
        List<Habilidad> habilidades = personaje.getHabilidades();
        DndWeaponProficiencies weaponProficiencies = dndCombatUtils.resolverCompetenciasArma(personaje);
        Map<Long, Objeto> weaponObjectsById = dndCombatUtils.resolverObjetosArmaPorHabilidades(habilidades);

        return new PersonajeDetalleResponse(
                personaje.getId(),
                personaje.getNombre(),
                personaje.getRetrato(),
                personaje.getBiografia(),
                personaje.getSistemaDeJuego().getDisplayName(),
                TagUtils.extractTagValue(personaje.getTags(), "Raza"),
                TagUtils.extractTagValue(personaje.getTags(), "Subraza"),
                dndCharacterStatsUtils.resolverClasesPersonaje(personaje),
                dndCharacterStatsUtils.resolverCaracteristicaLanzamientoConjuros(personaje),
                estadisticas,
                habilidades.stream()
                        .map(habilidad -> new HabilidadResponse(
                                habilidad.getId(),
                                habilidad.getNombre(),
                                dndCombatUtils.resolverBonificacionHabilidad(
                                        personaje,
                                        habilidad,
                                        estadisticas,
                                        weaponProficiencies,
                                        weaponObjectsById
                                ),
                                habilidad.getFormula(),
                                habilidad.getDescripcion(),
                                habilidad.getTags()
                        ))
                        .toList(),
                mochilaService.obtenerItemsPersonaje(personajeId),
                personaje.getUsado(),
                tipo,
                null,
                personaje.getUsuario() != null ? personaje.getUsuario().getUsername() : null,
                personaje.getTags()
        );
    }

    private Integer resolverBonificacionHabilidadEnemigo(
            Habilidad h,
            Map<Long, Mochila> mochilaByObjetoId
    ) {
        if (h.getTags() != null) {
            for (String rawTag : h.getTags().split(",")) {
                String tag = rawTag.trim();
                if (tag.length() > 5 && tag.substring(0, 5).equalsIgnoreCase("BONO;")) {
                    try {
                        return Integer.parseInt(tag.substring(5).trim());
                    } catch (NumberFormatException ignored) { }
                    break;
                }
            }
        }

        Long objetoId = dndCombatUtils.extraerIdObjetoArma(h.getTags());
        if (objetoId != null) {
            Mochila item = mochilaByObjetoId.get(objetoId);
            if (item != null && item.getObjeto() != null) {
                return dndCombatUtils.extraerBonoAtaqueDesdeIndice(item.getObjeto().getIndice());
            }
        }

        return 0;
    }
}
