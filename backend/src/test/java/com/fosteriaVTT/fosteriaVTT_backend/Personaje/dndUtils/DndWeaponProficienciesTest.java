package com.fosteriaVTT.fosteriaVTT_backend.Personaje.dndUtils;

import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fosteriaVTT.fosteriaVTT_backend.Objeto.Objeto;
import org.junit.jupiter.api.Test;

class DndWeaponProficienciesTest {

    @Test
    void aplicaAArmasSimplesMarcialesYEspecificas() {
        DndWeaponProficiencies proficiencies = new DndWeaponProficiencies();
        proficiencies.agregarEntradas(java.util.List.of(
                "Armas simples",
                "Armas marciales a distancia",
                "espada larga y hacha de mano"
        ));

        assertTrue(proficiencies.aplicaA(objeto("ASimple;ASCuerpo", "Garrote")));
        assertTrue(proficiencies.aplicaA(objeto("AMRango", "Arco largo")));
        assertTrue(proficiencies.aplicaA(objeto("arma", "Espada larga")));
        assertTrue(proficiencies.aplicaA(objeto("arma", "Hacha de mano")));
        assertTrue(proficiencies.aplicaA(objeto("AMCuerpo", "Mangual")));
    }

    @Test
    void soportaCategoriasDetalladasYEntradasVacias() {
        DndWeaponProficiencies proficiencies = new DndWeaponProficiencies();
        proficiencies.agregarEntradas(null);
        proficiencies.agregarEntrada("  ");
        proficiencies.agregarEntrada("prefijo:Armas simples a distancia");
        proficiencies.agregarEntrada("Armas marciales cuerpo a cuerpo");

        assertTrue(proficiencies.aplicaA(objeto("ASimple;ASRango", "Honda")));
        assertTrue(proficiencies.aplicaA(objeto("AMCuerpo", "Alabarda")));
        assertTrue(proficiencies.aplicaA(objeto("ASimple;ASCuerpo", "Maza")));
    }

    private static Objeto objeto(String indice, String nombre) {
        return Objeto.builder()
                .indice(indice)
                .nombre(nombre)
                .descripcion("")
                .build();
    }
}