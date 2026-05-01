package com.fosteriaVTT.fosteriaVTT_backend.Personaje.dndUtils;

import com.fosteriaVTT.fosteriaVTT_backend.Objeto.Objeto;
import com.fosteriaVTT.fosteriaVTT_backend.common.TagUtils;
import com.fosteriaVTT.fosteriaVTT_backend.common.dnd.DndWeaponRules;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public final class DndWeaponProficiencies {
	private boolean simple;
	private boolean simpleMelee;
	private boolean simpleRanged;
	private boolean martial;
	private boolean martialMelee;
	private boolean martialRanged;
	private final Set<String> specificWeapons = new HashSet<>();

	public void agregarEntradas(Collection<String> entradas) {
		for (String entrada : entradas == null ? List.<String>of() : entradas) {
			agregarEntrada(entrada);
		}
	}

	public void agregarEntrada(String entrada) {
		String limpia = TagUtils.cleanValue(entrada);
		if (limpia.isBlank()) {
			return;
		}

		String normalizada = TagUtils.normalizeText(limpia);
		if (normalizada.contains(TagUtils.normalizeText("Armas simples"))) {
			simple = true;
		}
		if (normalizada.contains(TagUtils.normalizeText("Armas simples cuerpo a cuerpo"))) {
			simpleMelee = true;
		}
		if (normalizada.contains(TagUtils.normalizeText("Armas simples a distancia"))) {
			simpleRanged = true;
		}
		if (normalizada.contains(TagUtils.normalizeText("Armas marciales"))) {
			martial = true;
		}
		if (normalizada.contains(TagUtils.normalizeText("Armas marciales cuerpo a cuerpo"))) {
			martialMelee = true;
		}
		if (normalizada.contains(TagUtils.normalizeText("Armas marciales a distancia"))) {
			martialRanged = true;
		}

		for (String parte : limpia.split(",|\\sy\\s")) {
			String arma = DndWeaponRules.normalizeWeaponCompetency(parte);
			if (!arma.isBlank()) {
				specificWeapons.add(arma);
			}
		}
	}

	public boolean aplicaA(Objeto objeto) {
		String indiceNormalizado = TagUtils.normalizeText(objeto.getIndice());
		if (simple && indiceNormalizado.contains(TagUtils.normalizeText("ASimple"))) {
			return true;
		}
		if (simpleMelee && indiceNormalizado.contains(TagUtils.normalizeText("ASimple"))
				&& indiceNormalizado.contains(TagUtils.normalizeText("ASCuerpo"))) {
			return true;
		}
		if (simpleRanged && indiceNormalizado.contains(TagUtils.normalizeText("ASimple"))
				&& indiceNormalizado.contains(TagUtils.normalizeText("ASRango"))) {
			return true;
		}
		if (martial && (indiceNormalizado.contains(TagUtils.normalizeText("AMCuerpo"))
				|| indiceNormalizado.contains(TagUtils.normalizeText("AMRango")))) {
			return true;
		}
		if (martialMelee && indiceNormalizado.contains(TagUtils.normalizeText("AMCuerpo"))) {
			return true;
		}
		if (martialRanged && indiceNormalizado.contains(TagUtils.normalizeText("AMRango"))) {
			return true;
		}
		return specificWeapons.contains(DndWeaponRules.normalizeWeaponCompetency(objeto.getNombre()));
	}
}