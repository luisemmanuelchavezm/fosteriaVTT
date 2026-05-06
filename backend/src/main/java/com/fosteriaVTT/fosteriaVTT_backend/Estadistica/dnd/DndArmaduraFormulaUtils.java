package com.fosteriaVTT.fosteriaVTT_backend.Estadistica.dnd;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class DndArmaduraFormulaUtils {

	private static final Pattern PATRON_CLASE_ARMADURA = Pattern.compile(
			"(?<![A-Z_])CA=(\\d+)(?:\\+([A-Z]{3})(?:\\(max:(\\d+)\\))?)?",
			Pattern.CASE_INSENSITIVE
	);
	private static final Pattern PATRON_BONO_ESCUDO = Pattern.compile("BONO_CA=(\\d+)", Pattern.CASE_INSENSITIVE);

	private DndArmaduraFormulaUtils() {}

	public static Integer extraerClaseArmadura(String formula, Map<String, Integer> baseStats) {
		String cleanedFormula = formula == null ? "" : formula.trim();
		if (cleanedFormula.isBlank()) {
			return null;
		}

		Matcher matcher = PATRON_CLASE_ARMADURA.matcher(cleanedFormula);
		if (!matcher.find()) {
			return null;
		}

		int armorClass = Integer.parseInt(matcher.group(1));
		String modifierCode = matcher.group(2);
		String modifierCap = matcher.group(3);
		if (modifierCode != null && !modifierCode.isBlank()) {
			int abilityModifier = DndCaracteristicaUtils.resolverModificadorPorCodigo(baseStats, modifierCode);
			if (modifierCap != null && !modifierCap.isBlank()) {
				abilityModifier = Math.min(abilityModifier, Integer.parseInt(modifierCap));
			}
			armorClass += abilityModifier;
		}

		return armorClass;
	}

	public static Integer extraerBonoEscudo(String formula) {
		String cleanedFormula = formula == null ? "" : formula.trim();
		if (cleanedFormula.isBlank()) {
			return null;
		}

		Matcher matcher = PATRON_BONO_ESCUDO.matcher(cleanedFormula);
		if (!matcher.find()) {
			return null;
		}

		return Integer.parseInt(matcher.group(1));
	}
}