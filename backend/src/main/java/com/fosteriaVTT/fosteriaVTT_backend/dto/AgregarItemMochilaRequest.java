package com.fosteriaVTT.fosteriaVTT_backend.dto;

import com.fosteriaVTT.fosteriaVTT_backend.Objeto.TipoObjeto;

public record AgregarItemMochilaRequest(
        Long objetoId,
        String nombre,
        String formula,
        String descripcion,
        TipoObjeto tipoObjeto,
        String indice,
        Integer cantidad
) {
}