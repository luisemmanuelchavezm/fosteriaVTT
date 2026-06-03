package com.fosteriaVTT.fosteriaVTT_backend.Personaje;

import com.fosteriaVTT.fosteriaVTT_backend.Estadistica.EstadisticaService;
import com.fosteriaVTT.fosteriaVTT_backend.Personaje.dndUtils.DndCharacterAbilityManagementUtils;
import com.fosteriaVTT.fosteriaVTT_backend.dto.PersonajeDetalleResponse;
import com.fosteriaVTT.fosteriaVTT_backend.dto.morkborg.ActualizarHPMBRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.morkborg.ActualizarSuministrosMBRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.morkborg.AgregarRasgoCustomMBRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.morkborg.EscoriaEspecialidadRequest;
import com.fosteriaVTT.fosteriaVTT_backend.dto.morkborg.MejorarPersonajeMBRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PersonajeMBService {

    private final PersonajeService personajeService;
    private final EstadisticaService estadisticaService;
    private final DndCharacterAbilityManagementUtils dndCharacterAbilityManagementUtils;

    public PersonajeMBService(
            PersonajeService personajeService,
            EstadisticaService estadisticaService,
            DndCharacterAbilityManagementUtils dndCharacterAbilityManagementUtils
    ) {
        this.personajeService = personajeService;
        this.estadisticaService = estadisticaService;
        this.dndCharacterAbilityManagementUtils = dndCharacterAbilityManagementUtils;
    }

    @Transactional
    public void actualizarSuministrosMB(Long personajeId, ActualizarSuministrosMBRequest request, String username) {
        Personaje personaje = personajeService.obtenerPersonajeUsuario(personajeId, username);
        estadisticaService.actualizarSuministrosMB(personaje, request);
        personajeService.emitirActualizacionPersonaje(personajeId);
    }

    @Transactional
    public void actualizarHPMB(Long personajeId, ActualizarHPMBRequest request, String username) {
        Personaje personaje = personajeService.obtenerPersonajeUsuario(personajeId, username);
        estadisticaService.actualizarHPMB(personaje, request);
        personajeService.emitirActualizacionPersonaje(personajeId);
    }

    @Transactional
    public PersonajeDetalleResponse agregarRasgoClaseMB(Long personajeId, Long habilidadId, String username) {
        Personaje personaje = personajeService.obtenerPersonajeUsuario(personajeId, username);
        dndCharacterAbilityManagementUtils.agregarRasgoClaseMB(personaje, habilidadId);
        personajeService.emitirActualizacionPersonaje(personajeId);
        return personajeService.obtenerDetallePersonaje(personajeId, username);
    }

    @Transactional
    public PersonajeDetalleResponse crearRasgoCustomMB(Long personajeId, AgregarRasgoCustomMBRequest request, String username) {
        Personaje personaje = personajeService.obtenerPersonajeUsuario(personajeId, username);
        dndCharacterAbilityManagementUtils.crearRasgoCustomMB(personaje, request.nombre(), request.descripcion());
        personajeService.emitirActualizacionPersonaje(personajeId);
        return personajeService.obtenerDetallePersonaje(personajeId, username);
    }

    @Transactional
    public PersonajeDetalleResponse intercambiarEscoriaEspecialidad(Long personajeId, EscoriaEspecialidadRequest request, String username) {
        Personaje personaje = personajeService.obtenerPersonajeUsuario(personajeId, username);
        dndCharacterAbilityManagementUtils.intercambiarEscoriaEspecialidad(personaje, request.habilidadesAEliminar(), request.nuevosIdxs());
        personajeService.emitirActualizacionPersonaje(personajeId);
        return personajeService.obtenerDetallePersonaje(personajeId, username);
    }

    @Transactional
    public PersonajeDetalleResponse mejorarPersonajeMB(Long personajeId, MejorarPersonajeMBRequest request, String username) {
        Personaje personaje = personajeService.obtenerPersonajeUsuario(personajeId, username);
        estadisticaService.mejorarPersonajeMB(personaje, request);
        personajeService.emitirActualizacionPersonaje(personajeId);
        return personajeService.obtenerDetallePersonaje(personajeId, username);
    }
}
