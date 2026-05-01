package com.fosteriaVTT.fosteriaVTT_backend.dto;

import com.fosteriaVTT.fosteriaVTT_backend.Objeto.TipoObjeto;

public record ObjetoInicialResponse(
	Long id,
	String nombre,
	String descripcion,
	String formula,
	TipoObjeto tipoObjeto,
	String indice,
	Integer cantidad
) {
}
