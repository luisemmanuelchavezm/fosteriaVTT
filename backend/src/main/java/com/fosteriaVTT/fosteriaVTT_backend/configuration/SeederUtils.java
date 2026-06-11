package com.fosteriaVTT.fosteriaVTT_backend.configuration;

import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.Habilidad;
import com.fosteriaVTT.fosteriaVTT_backend.Objeto.Objeto;
import com.fosteriaVTT.fosteriaVTT_backend.Objeto.TipoObjeto;

class SeederUtils {

    private SeederUtils() {}

    static Habilidad buildSkill(
            String nombre,
            String formula,
            String descripcion,
            String tags
    ) {
        return Habilidad.builder()
                .nombre(nombre)
                .formula(formula)
                .descripcion(descripcion)
                .tags(tags)
                .build();
    }

    static String fixMBFormula(String formula) {
        if (formula == null) return null;
        if (formula.startsWith("-d")) return "-1" + formula.substring(1);
        if (formula.matches("d\\d.*")) return "1" + formula;
        return formula;
    }

    static Objeto buildInitialObject(
            String indice,
            String nombre,
            String formula,
            String descripcion,
            TipoObjeto tipoObjeto
    ) {
        return Objeto.builder()
            .indice(indice == null || indice.isBlank() ? "VISIBILIDAD;oficial" : indice + ",VISIBILIDAD;oficial")
                .nombre(nombre)
                .formula(SeederUtils.fixMBFormula(formula))
                .descripcion(descripcion != null ? descripcion : "")
                .tipoObjeto(tipoObjeto)
                .build();
    }
}
