package com.fosteriaVTT.fosteriaVTT_backend.InformacionDnd;

import com.fosteriaVTT.fosteriaVTT_backend.ContenidoSistemaJson.ContenidoSistemaJsonService;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndSubclaseRasgoResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ClaseDndSubclaseResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DndSubclassServiceTest {

    @Mock
    private ContenidoSistemaJsonService contenidoSistemaJsonService;

    @InjectMocks
    private DndSubclassService dndSubclassService;

    @Test
    void buscaSubclasesPorIdONombreYDevuelveListasVaciasCuandoProcede() {
        List<ClaseDndSubclaseResponse> subclases = List.of(
                new ClaseDndSubclaseResponse("evocacion", "Escuela de evocacion", "", 2, List.of()),
                new ClaseDndSubclaseResponse("ilusion", "Escuela de ilusion", "", 2, List.of())
        );
        when(contenidoSistemaJsonService.obtenerSubclasesClaseDnd("mago")).thenReturn(subclases);

        assertEquals(subclases, dndSubclassService.obtenerSubclasesPorClase("mago"));
        assertTrue(dndSubclassService.obtenerSubclasesPorClase(" ").isEmpty());
        assertEquals("evocacion", dndSubclassService.buscarSubclase("mago", "Escuela de evocación").orElseThrow().id());
        assertTrue(dndSubclassService.buscarSubclase("mago", " ").isEmpty());
    }

    @Test
    void obtieneSoloLosRasgosDeLaSubclaseSeleccionada() {
        when(contenidoSistemaJsonService.obtenerSubclasesClaseDnd("mago")).thenReturn(List.of(
                new ClaseDndSubclaseResponse("evocacion", "Escuela de evocacion", "", 2, List.of())
        ));
        when(contenidoSistemaJsonService.obtenerRasgosSubclaseClaseDnd("mago")).thenReturn(List.of(
                new ClaseDndSubclaseRasgoResponse("evocacion", 2, "Esculpir conjuros", null, ""),
                new ClaseDndSubclaseRasgoResponse("ilusion", 2, "Ilusiones mejoradas", null, "")
        ));

        assertEquals(List.of(
                new ClaseDndSubclaseRasgoResponse("evocacion", 2, "Esculpir conjuros", null, "")
        ), dndSubclassService.obtenerRasgosSubclase("mago", "evocacion"));
        assertTrue(dndSubclassService.obtenerRasgosSubclase("mago", "desconocida").isEmpty());
    }
}