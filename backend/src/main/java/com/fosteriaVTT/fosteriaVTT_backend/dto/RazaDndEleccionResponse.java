package com.fosteriaVTT.fosteriaVTT_backend.dto;

import java.util.List;

public record RazaDndEleccionResponse(
        String id,
        String etiqueta,
        String resumen,
        String catalogo,
        int cantidad,
        String adjuntarATitulo,
        List<String> opciones,
        List<String> excluirOpciones
) implements CatalogoDndEleccion {
}