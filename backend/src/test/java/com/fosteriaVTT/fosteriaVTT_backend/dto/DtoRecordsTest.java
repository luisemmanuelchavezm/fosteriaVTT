package com.fosteriaVTT.fosteriaVTT_backend.dto;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Verifica los records del paquete dto asegurando que sus constructores
 * y accesores funcionan correctamente.
 */
class DtoRecordsTest {

    private static final LocalDateTime TIMESTAMP = LocalDateTime.of(2026, 5, 1, 10, 0);

    // ── PestañaCampañaResponse ────────────────────────────────────────────────

    @Test
    void pestañaCampañaResponseAlmacenaValores() {
        var r = new PestañaCampañaResponse(1L, "Mazmorra", 20, 15, 5, "ft", "false",
                "http://img.test/base", "http://img.test/capa", TIMESTAMP, "dm1");
        assertEquals(1L, r.id());
        assertEquals("Mazmorra", r.nombre());
        assertEquals(20, r.nCuadriculasX());
        assertEquals(15, r.nCuadriculasY());
        assertEquals(5, r.distanciaCasilla());
        assertEquals("ft", r.sistemaMetrico());
        assertEquals("false", r.nieblaDeGuerra());
        assertEquals("http://img.test/base", r.imagenBaseUrl());
        assertEquals("http://img.test/capa", r.mapaCapaUrl());
        assertEquals(TIMESTAMP, r.ultimaVezUsada());
        assertEquals("dm1", r.dmUsername());
    }

    // ── PosicionResponse ──────────────────────────────────────────────────────

    @Test
    void posicionResponseAlmacenaValores() {
        var r = new PosicionResponse(10L, 2L, "tokens", 5L, "Aragorn", "retrato.png", 3, 7, 1, 1, "personaje");
        assertEquals(10L, r.id());
        assertEquals(2L, r.pestanaId());
        assertEquals("tokens", r.capa());
        assertEquals(5L, r.personajeId());
        assertEquals("Aragorn", r.personajeNombre());
        assertEquals("retrato.png", r.retrato());
        assertEquals(3, r.posicionX());
        assertEquals(7, r.posicionY());
        assertEquals(1, r.largo());
        assertEquals(1, r.ancho());
        assertEquals("personaje", r.tipo());
    }

    // ── DibujoResponse ────────────────────────────────────────────────────────

    @Test
    void dibujoResponseAlmacenaValores() {
        List<PuntoDibujoPayload> puntos = List.of(
                new PuntoDibujoPayload(10, 20),
                new PuntoDibujoPayload(30, 40)
        );
        var r = new DibujoResponse(3L, 1L, "dibujos", "linea", "#FF0000", false, null, null, puntos, TIMESTAMP);
        assertEquals(3L, r.id());
        assertEquals(1L, r.pestanaId());
        assertEquals("dibujos", r.capa());
        assertEquals("linea", r.tipo());
        assertEquals("#FF0000", r.color());
        assertFalse(r.relleno());
        assertEquals(2, r.puntos().size());
        assertEquals(TIMESTAMP, r.actualizadoEn());
    }

    @Test
    void puntoDibujoPayloadAlmacenaValores() {
        var p = new PuntoDibujoPayload(15, 25);
        assertEquals(15, p.x());
        assertEquals(25, p.y());
    }

    // ── CrearDibujoWsRequest ──────────────────────────────────────────────────

    @Test
    void crearDibujoWsRequestAlmacenaValores() {
        List<PuntoDibujoPayload> puntos = List.of(new PuntoDibujoPayload(0, 0));
        var r = new CrearDibujoWsRequest(5L, "dibujos", "rect", "#0000FF", true, puntos);
        assertEquals(5L, r.pestanaId());
        assertEquals("dibujos", r.capa());
        assertEquals("rect", r.tipo());
        assertEquals("#0000FF", r.color());
        assertTrue(r.relleno());
        assertEquals(1, r.puntos().size());
    }

    @Test
    void borrarDibujoWsRequestAlmacenaValores() {
        var r = new BorrarDibujoWsRequest(2L, "dibujos", 99L);
        assertEquals(2L, r.pestanaId());
        assertEquals("dibujos", r.capa());
        assertEquals(99L, r.dibujoId());
    }

    // ── PosicionRequest / WsRequest ───────────────────────────────────────────

    @Test
    void crearPosicionRequestAlmacenaValores() {
        var r = new CrearPosicionRequest(3L, "tokens", 7L, 4, 8);
        assertEquals(3L, r.pestanaId());
        assertEquals("tokens", r.capa());
        assertEquals(7L, r.personajeId());
        assertEquals(4, r.posicionX());
        assertEquals(8, r.posicionY());
    }

    @Test
    void crearPosicionWsRequestAlmacenaValores() {
        var r = new CrearPosicionWsRequest(4L, "gm", 12L, 5, 9);
        assertEquals(4L, r.pestanaId());
        assertEquals("gm", r.capa());
        assertEquals(12L, r.personajeId());
        assertEquals(5, r.posicionX());
        assertEquals(9, r.posicionY());
    }

    @Test
    void actualizarTamanoRequestAlmacenaValores() {
        var r = new ActualizarTamanoRequest(3, 2);
        assertEquals(3, r.largo());
        assertEquals(2, r.ancho());
    }

    // ── CapaMapaResponse ──────────────────────────────────────────────────────

    @Test
    void capaMapaResponseAlmacenaValores() {
        var r = new CapaMapaResponse(100L, 5L, 20L, "https://img.test/mapa.png");
        assertEquals(100L, r.capaId());
        assertEquals(5L, r.pestanaId());
        assertEquals(20L, r.mapaId());
        assertEquals("https://img.test/mapa.png", r.mapaUrl());
    }

    @Test
    void asignarMapaCapaRequestAlmacenaValores() {
        var r = new AsignarMapaCapaRequest(3L, 7L);
        assertEquals(3L, r.pestanaId());
        assertEquals(7L, r.mapaId());
    }

    // ── WebSocket DTOs ────────────────────────────────────────────────────────

    @Test
    void webSocketErrorResponseAlmacenaValores() {
        var r = new WebSocketErrorResponse(403, "Forbidden", "No tienes permiso");
        assertEquals(403, r.status());
        assertEquals("Forbidden", r.error());
        assertEquals("No tienes permiso", r.message());
    }

    @Test
    void webSocketChatMessageDTOAlmacenaValores() {
        var r = new WebSocketChatMessageDTO(8L, "maestro", "¡Al ataque!", TIMESTAMP);
        assertEquals(8L, r.id());
        assertEquals("maestro", r.username());
        assertEquals("¡Al ataque!", r.mensaje());
        assertEquals(TIMESTAMP, r.enviadoEn());
    }

    @Test
    void webSocketPlayerEventDTOAlmacenaValores() {
        var r = new WebSocketPlayerEventDTO("jugador1", false, "CONNECTED");
        assertEquals("jugador1", r.username());
        assertFalse(r.dm());
        assertEquals("CONNECTED", r.eventType());
    }

    @Test
    void webSocketPlayersListDTOAlmacenaLista() {
        List<JugadorCampañaResponse> players = List.of(
                new JugadorCampañaResponse("jugador1", false),
                new JugadorCampañaResponse("dm1", true)
        );
        var r = new WebSocketPlayersListDTO(players);
        assertEquals(2, r.players().size());
    }

    @Test
    void webSocketPosicionEventDTOAlmacenaValores() {
        PosicionResponse posicion = new PosicionResponse(1L, 2L, "tokens", 3L, "Bilbo", null, 0, 0, 1, 1, "personaje");
        var r = new WebSocketPosicionEventDTO("CREATED", 1L, posicion);
        assertEquals("CREATED", r.accion());
        assertEquals(1L, r.posicionId());
        assertNotNull(r.posicion());
    }

    @Test
    void webSocketDibujoEventDTOAlmacenaValores() {
        DibujoResponse dibujo = new DibujoResponse(5L, 1L, "dibujos", "linea", "#FFF", false, null, null, List.of(), TIMESTAMP);
        var r = new WebSocketDibujoEventDTO("CREATED", 5L, dibujo);
        assertEquals("CREATED", r.accion());
        assertEquals(5L, r.dibujoId());
        assertNotNull(r.dibujo());
    }

    // ── JugadorCampañaResponse ────────────────────────────────────────────────

    @Test
    void jugadorCampañaResponseAlmacenaValores() {
        var dm = new JugadorCampañaResponse("maestro", true);
        var jugador = new JugadorCampañaResponse("aina", false);
        assertTrue(dm.dm());
        assertFalse(jugador.dm());
        assertEquals("maestro", dm.username());
    }

    // ── HabilidadNivelResponse / HabilidadResponse ────────────────────────────

    @Test
    void habilidadNivelResponseAlmacenaValores() {
        var r = new HabilidadNivelResponse(3, List.of());
        assertEquals(3, r.nivel());
        assertTrue(r.habilidades().isEmpty());
    }

    // ── ObjetoCatalogoResponse ────────────────────────────────────────────────

    @Test
    void objetoCatalogoResponseAlmacenaValores() {
        var r = new ObjetoCatalogoResponse(42L, "Espada larga", "1d8+STR", "Una espada básica", "arma");
        assertEquals(42L, r.id());
        assertEquals("Espada larga", r.nombre());
        assertEquals("1d8+STR", r.formula());
        assertEquals("Una espada básica", r.descripcion());
        assertEquals("arma", r.tipoObjeto());
    }
}
