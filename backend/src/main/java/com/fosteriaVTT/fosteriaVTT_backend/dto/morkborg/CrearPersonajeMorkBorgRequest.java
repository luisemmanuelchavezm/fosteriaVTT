package com.fosteriaVTT.fosteriaVTT_backend.dto.morkborg;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record CrearPersonajeMorkBorgRequest(
        @NotBlank String nombre,
        @NotBlank String claseId,
        /** Índices 0-based de la opción tirada (1 para la mayoría, 2 para Realeza). */
        List<Integer> claseOpciones,

        // ── Estadísticas ──────────────────────────────────────────────────────
        Integer fuerza,         Integer modFuerza,
        Integer agilidad,       Integer modAgilidad,
        Integer presencia,      Integer modPresencia,
        Integer resistencia,    Integer modResistencia,
        Integer vida,
        Integer presagios,
        Integer carga,

        // ── Equipo base ───────────────────────────────────────────────────────
        Integer plata,
        Integer comida,
        Integer armaIdx,        // 1–10
        Integer armaduraNivel,  // 0=sin armadura, 1=ligera, 2=media, 3=pesada

        // ── Equipo básico (tablas d6 / d12×2, todas las clases) ──────────────
        Integer contenedorResult,   // 1-6 (1-2 = Nada)
        Integer item1Result,        // 1-12
        Integer item2Result,        // 1-12

        // ── Pergamino opcional ────────────────────────────────────────────────
        Boolean wantsScroll,
        Integer perScrollTipo,  // 1=sagrado, 2=impuro
        Integer perScrollIdx,   // 1-10

        // ── Pergamino esotérico (Ermitaño) ────────────────────────────────────
        Integer esotScrollTipo,
        Integer esotScrollIdx,

        // ── Rasgos (todos opcionales) ─────────────────────────────────────────
        Integer rasgoTerrible1,
        Integer rasgoTerrible2,
        Integer cuerpoRoto,
        Integer habito,
        Integer historiaperturbadora
) {}
