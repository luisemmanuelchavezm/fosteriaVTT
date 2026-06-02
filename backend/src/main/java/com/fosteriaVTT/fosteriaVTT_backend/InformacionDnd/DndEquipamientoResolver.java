package com.fosteriaVTT.fosteriaVTT_backend.InformacionDnd;

import com.fosteriaVTT.fosteriaVTT_backend.Objeto.Objeto;
import com.fosteriaVTT.fosteriaVTT_backend.Objeto.ObjetoRepository;
import com.fosteriaVTT.fosteriaVTT_backend.dto.EquipamientoDndGrupoResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.EquipamientoDndOpcionResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.EquipamientoDndResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.ObjetoInicialResponse;
import java.util.Arrays;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
class DndEquipamientoResolver {

    private final ObjetoRepository objetoRepository;

    DndEquipamientoResolver(ObjetoRepository objetoRepository) {
        this.objetoRepository = objetoRepository;
    }

    EquipamientoDndResponse resolverEquipamiento(EquipamientoDndResponse equipamiento) {
        if (equipamiento == null) {
            return new EquipamientoDndResponse(List.of(), List.of());
        }

        List<EquipamientoDndOpcionResponse> fijos = listaSegura(equipamiento.fijos()).stream()
                .map(this::resolverOpcionEquipamiento)
                .toList();

        List<EquipamientoDndGrupoResponse> grupos = listaSegura(equipamiento.gruposEleccion()).stream()
                .map(grupo -> new EquipamientoDndGrupoResponse(
                        grupo.id(),
                        grupo.etiqueta(),
                        listaSegura(grupo.opciones()).stream()
                                .map(this::resolverOpcionEquipamiento)
                                .toList()
                ))
                .toList();

        return new EquipamientoDndResponse(fijos, grupos);
    }

    private EquipamientoDndOpcionResponse resolverOpcionEquipamiento(EquipamientoDndOpcionResponse opcion) {
        String nombreObjeto = opcion.objeto() != null ? opcion.objeto().nombre() : null;
        ObjetoInicialResponse objeto = nombreObjeto == null ? null : resolverObjetoPorNombre(nombreObjeto, opcion.cantidad());
        List<ObjetoInicialResponse> catalogo = opcion.catalogo() == null ? List.of() : resolverCatalogoObjetos(opcion.catalogo());

        return new EquipamientoDndOpcionResponse(
                opcion.id(),
                opcion.etiqueta(),
                opcion.cantidad(),
                objeto,
                opcion.catalogo(),
                catalogo
        );
    }

    private ObjetoInicialResponse resolverObjetoPorNombre(String nombre, Integer cantidad) {
        return objetoRepository.findByNombreIgnoreCaseOrderByIdAsc(nombre).stream()
                .findFirst()
                .map(objeto -> mapearObjeto(objeto, cantidad == null ? 1 : cantidad))
                .orElse(new ObjetoInicialResponse(
                        null,
                        nombre,
                        null,
                        null,
                        null,
                        "",
                        cantidad == null ? 1 : cantidad
                ));
    }

    private List<ObjetoInicialResponse> resolverCatalogoObjetos(String catalogo) {
        return objetoRepository.findAll().stream()
                .filter(objeto -> contieneEtiquetaExacta(objeto.getIndice(), catalogo))
                .map(objeto -> mapearObjeto(objeto, 1))
                .toList();
    }

    private boolean contieneEtiquetaExacta(String indice, String etiqueta) {
        if (indice == null || indice.isBlank()) {
            return false;
        }
        return Arrays.stream(indice.split(","))
                .map(String::trim)
                .anyMatch(parte -> parte.equalsIgnoreCase(etiqueta));
    }

    private ObjetoInicialResponse mapearObjeto(Objeto objeto, int cantidad) {
        return new ObjetoInicialResponse(
                objeto.getId(),
                objeto.getNombre(),
                objeto.getDescripcion(),
                objeto.getFormula(),
                objeto.getTipoObjeto(),
                objeto.getIndice(),
                cantidad
        );
    }

    private <T> List<T> listaSegura(List<T> items) {
        return items == null ? List.of() : java.util.Collections.unmodifiableList(items);
    }
}
