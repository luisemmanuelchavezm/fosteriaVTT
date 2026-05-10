package com.fosteriaVTT.fosteriaVTT_backend.Campaña;

import com.fosteriaVTT.fosteriaVTT_backend.Cloudinary.CloudinaryService;
import com.fosteriaVTT.fosteriaVTT_backend.Jugador.Jugador;
import com.fosteriaVTT.fosteriaVTT_backend.Jugador.JugadorRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.Rol;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.UserRepository;
import com.fosteriaVTT.fosteriaVTT_backend.Usuario.Usuario;
import com.fosteriaVTT.fosteriaVTT_backend.common.SistemaDeJuego;
import com.fosteriaVTT.fosteriaVTT_backend.dto.CampañaResumenResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.CrearCampañaRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.PagedResponse;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CampañaServiceTest {

    @Mock
    private JugadorRepository jugadorRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CampañaRepository campañaRepository;

    @Mock
    private CloudinaryService cloudinaryService;

    @InjectMocks
    private CampañaService campañaService;

    @Test
    void obtieneUltimasCampañasMapeadas() {
        Usuario usuario = Usuario.builder().id(1L).username("daria").email("d@test.com").password("pw").role(Rol.USER).build();
        Usuario dm = Usuario.builder().username("sai").email("s@test.com").password("pw").role(Rol.USER).build();
        Campaña campaña = Campaña.builder().id(2L).nombre("Sombras").dm(dm).sistemaDeJuego(SistemaDeJuego.COC).portadaUrl("img").build();
        Jugador jugador = Jugador.builder().usuario(usuario).campaña(campaña).ultimaVezAccedido(LocalDateTime.of(2026, 4, 10, 12, 0)).build();

        when(userRepository.findByUsername("daria")).thenReturn(Optional.of(usuario));
        when(jugadorRepository.findTop5ByUsuarioIdOrderByUltimaVezAccedidoDesc(1L)).thenReturn(List.of(jugador));

        List<CampañaResumenResponse> response = campañaService.obtenerUltimasCampañas("daria");

        assertEquals(1, response.size());
        assertEquals("Sombras", response.getFirst().nombre());
        assertEquals("Call Of Cthulhu", response.getFirst().sistemaDeJuego());
        assertEquals("sai", response.getFirst().dmUsername());
    }

    @Test
    void obtieneCampañasPaginadasYFiltradas() {
        Usuario usuario = Usuario.builder().id(1L).username("daria").email("d@test.com").password("pw").role(Rol.USER).build();
        Usuario dm = Usuario.builder().username("sai").email("s@test.com").password("pw").role(Rol.USER).build();
        Campaña campaña = Campaña.builder().id(2L).nombre("Sombras").dm(dm).sistemaDeJuego(SistemaDeJuego.DND).portadaUrl("img").build();
        Jugador jugador = Jugador.builder().usuario(usuario).campaña(campaña).ultimaVezAccedido(LocalDateTime.of(2026, 4, 10, 12, 0)).build();

        when(userRepository.findByUsername("daria")).thenReturn(Optional.of(usuario));
        when(jugadorRepository.buscarPorFiltros(eq("daria"), eq("som"), eq(List.of(SistemaDeJuego.DND)), eq(false), eq("sai"), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(jugador), PageRequest.of(0, 15), 1));

        PagedResponse<CampañaResumenResponse> response = campañaService.obtenerCampañasOrdenadasPorUltimoAcceso(
                "daria",
                "som",
                List.of("Dungeons and Dragons"),
                "sai",
                0,
                15
        );

        assertEquals(1, response.items().size());
        assertEquals("Sombras", response.items().getFirst().nombre());
        assertFalse(response.hasMore());
    }

    @Test
    void lanzaNotFoundSiElUsuarioNoExisteEnUltimasCampañas() {
        when(userRepository.findByUsername("daria")).thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> campañaService.obtenerUltimasCampañas("daria")
        );

        assertEquals(404, exception.getStatusCode().value());
    }

    @Test
    void lanzaNotFoundSiElUsuarioNoExisteEnCampañasPaginadas() {
        when(userRepository.findByUsername("daria")).thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> campañaService.obtenerCampañasOrdenadasPorUltimoAcceso("daria", null, null, null, 0, 15)
        );

        assertEquals(404, exception.getStatusCode().value());
    }

    @Test
    void creaCampañaConPortadaPorDefectoCuandoNoHayArchivo() {
        Usuario usuario = Usuario.builder().id(7L).username("daria").email("d@test.com").password("pw").role(Rol.USER).build();
        CrearCampañaRequest request = new CrearCampañaRequest("Sombras de Arkham", "Call Of Cthulhu");

        Campaña campañaGuardada = Campaña.builder()
                .id(10L)
                .nombre("Sombras de Arkham")
                .sistemaDeJuego(SistemaDeJuego.COC)
                .dm(usuario)
                .build();

        Jugador jugadorGuardado = Jugador.builder()
                .usuario(usuario)
                .campaña(campañaGuardada)
                .ultimaVezAccedido(LocalDateTime.of(2026, 5, 1, 12, 30))
                .build();

        when(userRepository.findByUsername("daria")).thenReturn(Optional.of(usuario));
        when(campañaRepository.save(any(Campaña.class))).thenReturn(campañaGuardada);
        when(jugadorRepository.save(any(Jugador.class))).thenReturn(jugadorGuardado);

        CampañaResumenResponse response = campañaService.crearCampaña(request, null, "daria");

        assertEquals("Sombras de Arkham", response.nombre());
        assertEquals("Call Of Cthulhu", response.sistemaDeJuego());
        assertEquals("daria", response.dmUsername());
        verify(campañaRepository).save(any(Campaña.class));
        verify(jugadorRepository).save(any(Jugador.class));
    }

    @Test
    void creaCampañaSubiendoPortadaACoudinaryCuandoHayArchivo() throws Exception {
        Usuario usuario = Usuario.builder().id(7L).username("daria").email("d@test.com").password("pw").role(Rol.USER).build();
        CrearCampañaRequest request = new CrearCampañaRequest("La taberna", "Dungeons and Dragons");
        MockMultipartFile portada = new MockMultipartFile("cover", "portada.jpg", "image/jpeg", "abc".getBytes());

        Campaña campañaGuardada = Campaña.builder()
                .id(11L)
                .nombre("La taberna")
                .sistemaDeJuego(SistemaDeJuego.DND)
                .dm(usuario)
                .portadaUrl("https://cloudinary.test/portada.jpg")
                .build();
        Jugador jugadorGuardado = Jugador.builder().usuario(usuario).campaña(campañaGuardada).build();

        when(userRepository.findByUsername("daria")).thenReturn(Optional.of(usuario));
        when(cloudinaryService.uploadFile(portada)).thenReturn("https://cloudinary.test/portada.jpg");
        when(campañaRepository.save(any(Campaña.class))).thenReturn(campañaGuardada);
        when(jugadorRepository.save(any(Jugador.class))).thenReturn(jugadorGuardado);

        CampañaResumenResponse response = campañaService.crearCampaña(request, portada, "daria");

        assertEquals("https://cloudinary.test/portada.jpg", response.portadaUrl());
        verify(cloudinaryService).uploadFile(portada);
    }
}