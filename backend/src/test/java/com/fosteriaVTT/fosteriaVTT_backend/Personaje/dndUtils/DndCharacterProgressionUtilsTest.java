package com.fosteriaVTT.fosteriaVTT_backend.Personaje.dndUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import com.fosteriaVTT.fosteriaVTT_backend.Chat.ChatService;
import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.Habilidad;
import com.fosteriaVTT.fosteriaVTT_backend.InformacionDnd.DndSubclassService;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.Personaje;
import com.fosteriaVTT.fosteriaVTT_backend.common.SistemaDeJuego;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndEleccionResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndSubclaseResponse;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class DndCharacterProgressionUtilsTest {

    @Mock
    private ChatService chatService;

    @Mock
    private DndAbilityUtils dndAbilityUtils;

    @Mock
    private DndCharacterAbilityManagementUtils dndCharacterAbilityManagementUtils;

    @Mock
    private DndSubclassService dndSubclassService;

    @InjectMocks
    private DndCharacterProgressionUtils dndCharacterProgressionUtils;

    private ClaseDndSubclaseResponse campeon;
    private ClaseDndSubclaseResponse maestro;
    private ClaseDndDetalleResponse clase;

    @BeforeEach
    void setUp() {
        campeon = new ClaseDndSubclaseResponse("campeon", "Campeon", "", 1, List.of());
        maestro = new ClaseDndSubclaseResponse("maestro-batalla", "Maestro de batalla", "", 3, List.of());
        clase = new ClaseDndDetalleResponse(
                "guerrero",
                "Guerrero",
                "",
                "",
                null,
                null,
                null,
                List.of(campeon, maestro),
                List.of(new ClaseDndEleccionResponse("class-skill-0", "Competencia", "", "habilidades", 1, List.of("Arcano"))),
                null
        );
    }

    @Test
    void resuelveSubclaseInicialYValidaCasosObligatorios() {
        when(dndSubclassService.buscarSubclase("guerrero", "campeon")).thenReturn(Optional.of(campeon));

        assertEquals(campeon, dndCharacterProgressionUtils.resolverSubclaseInicial(clase, "campeon"));
        assertThrows(ResponseStatusException.class, () -> dndCharacterProgressionUtils.resolverSubclaseInicial(clase, null));
        assertThrows(ResponseStatusException.class, () -> dndCharacterProgressionUtils.resolverSubclaseInicial(clase, "maestro-batalla"));
    }

    @Test
    void resuelveSubclaseParaProgresionYSubclaseActual() {
        Personaje personaje = Personaje.builder()
                .nombre("Iria")
                .sistemaDeJuego(SistemaDeJuego.DND)
                .tags("Subclase;Campeon")
                .habilidades(new ArrayList<>())
                .build();

        assertEquals(campeon, dndCharacterProgressionUtils.resolverSubclaseActual(personaje, clase));
        assertEquals(campeon, dndCharacterProgressionUtils.resolverSubclaseParaProgresion(personaje, clase, null, 3, false));

        when(dndSubclassService.buscarSubclase("guerrero", "maestro-batalla")).thenReturn(Optional.of(maestro));
        personaje.setTags(null);

        assertEquals(maestro, dndCharacterProgressionUtils.resolverSubclaseParaProgresion(personaje, clase, "maestro-batalla", 3, false));
        assertThrows(ResponseStatusException.class, () -> dndCharacterProgressionUtils.resolverSubclaseParaProgresion(personaje, clase, null, 3, false));
    }

    @Test
    void devuelveNullCuandoNoHaySubclaseRequeridaNiActual() {
        ClaseDndDetalleResponse magoSinSubclase = new ClaseDndDetalleResponse(
                "mago", "Mago", "", "", null, null, null, List.of(), List.of(), null
        );
        Personaje personaje = Personaje.builder()
                .nombre("Lyra")
                .sistemaDeJuego(SistemaDeJuego.DND)
                .habilidades(new ArrayList<>())
                .build();

        assertNull(dndCharacterProgressionUtils.resolverSubclaseActual(personaje, magoSinSubclase));
        assertNull(dndCharacterProgressionUtils.resolverSubclaseParaProgresion(personaje, magoSinSubclase, null, 2, false));
    }

    @Test
    void revierteEleccionesRegistradasYMejoraDividida() {
        Personaje personaje = Personaje.builder()
                .nombre("Iria")
                .sistemaDeJuego(SistemaDeJuego.DND)
                .habilidades(new ArrayList<>(List.of(
                        habilidad("Competencia: Arcano", "DND,CLASE"),
                        habilidad("Otra", "DND")
                )))
                .build();
        Map<String, Integer> baseStats = new LinkedHashMap<>();
        baseStats.put("Fuerza", 12);
        baseStats.put("Destreza", 14);

        when(chatService.obtenerUltimoRegistroInterno(personaje, "guerrero", 3)).thenReturn(Optional.of(Map.of(
                "eleccionesClase", "class-skill-0:Arcano",
                "modoMejoraCaracteristica", "dos",
                "caracteristicaPrimaria", "Fuerza",
                "caracteristicaSecundaria", "Destreza"
        )));
        when(dndAbilityUtils.resolverHechizoPorNombre("Arcano")).thenReturn(Optional.empty());

        dndCharacterProgressionUtils.revertirProgresionRegistradaSiCorresponde(personaje, clase, 3, baseStats);

        assertEquals(1, personaje.getHabilidades().size());
        assertEquals(11, baseStats.get("Fuerza"));
        assertEquals(13, baseStats.get("Destreza"));
    }

    private static Habilidad habilidad(String nombre, String tags) {
        return Habilidad.builder().nombre(nombre).tags(tags).build();
    }
}