package com.fosteriaVTT.fosteriaVTT_backend.common;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SistemaDeJuegoTest {

    @Test
    void reconoceElValorPorNombreYDisplayName() {
        assertEquals(SistemaDeJuego.DND, SistemaDeJuego.fromValue("DND").orElseThrow());
        assertEquals(
                SistemaDeJuego.MORK_BORG,
                SistemaDeJuego.fromValue("Mork Borg").orElseThrow()
        );
    }

    @Test
    void devuelveVacioConValoresInvalidos() {
        assertTrue(SistemaDeJuego.fromValue(null).isEmpty());
        assertTrue(SistemaDeJuego.fromValue("desconocido").isEmpty());
    }
}
