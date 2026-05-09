package com.fosteriaVTT.fosteriaVTT_backend.Estadistica.dnd;

import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.Habilidad;
import com.fosteriaVTT.fosteriaVTT_backend.Mochila.Mochila;
import java.util.List;
import java.util.Map;

public final class DndClaseArmaduraCalculator {

	private DndClaseArmaduraCalculator() {}

	public static int calcular(Map<String, Integer> baseStats, List<Mochila> mochila, List<Habilidad> habilidades) {
		ModificadoresCaracteristica modificadores = resolverModificadores(baseStats);
		EstadoEquipoArmadura estadoEquipo = resolverEstadoEquipo(mochila, baseStats, modificadores.destreza());
		int armorClass = aplicarDefensasSinArmadura(estadoEquipo.claseArmaduraBase(), estadoEquipo, modificadores, habilidades);

		if (DndArmaduraCheckers.tieneEstiloDefensaConArmadura(estadoEquipo.armaduraEquipada(), habilidades)) {
			armorClass += 1;
		}

		return armorClass + estadoEquipo.bonoEscudo();
	}

	private static ModificadoresCaracteristica resolverModificadores(Map<String, Integer> baseStats) {
		return new ModificadoresCaracteristica(
				DndCaracteristicaUtils.resolverModificador(baseStats, "Destreza"),
				DndCaracteristicaUtils.resolverModificador(baseStats, "Constitucion"),
				DndCaracteristicaUtils.resolverModificador(baseStats, "Sabiduria")
		);
	}

	private static EstadoEquipoArmadura resolverEstadoEquipo(
			List<Mochila> mochila,
			Map<String, Integer> baseStats,
			int bonificadorDestreza
	) {
		int armorClass = 10 + bonificadorDestreza;
		int shieldBonus = 0;
		boolean hasArmorEquipped = false;
		boolean hasShieldEquipped = false;

		for (Mochila item : mochila == null ? List.<Mochila>of() : mochila) {
			if (!DndArmaduraCheckers.esArmaduraEquipada(item)) {
				continue;
			}

			Integer parsedArmorClass = DndArmaduraFormulaUtils.extraerClaseArmadura(item.getObjeto().getFormula(), baseStats);
			if (parsedArmorClass != null) {
				armorClass = parsedArmorClass;
				hasArmorEquipped = true;
				continue;
			}

			Integer parsedShieldBonus = DndArmaduraFormulaUtils.extraerBonoEscudo(item.getObjeto().getFormula());
			if (parsedShieldBonus != null) {
				shieldBonus += parsedShieldBonus;
				hasShieldEquipped = true;
			}
		}

		return new EstadoEquipoArmadura(armorClass, shieldBonus, hasArmorEquipped, hasShieldEquipped);
	}

	private static int aplicarDefensasSinArmadura(
			int armorClass,
			EstadoEquipoArmadura estadoEquipo,
			ModificadoresCaracteristica modificadores,
			List<Habilidad> habilidades
	) {
		if (DndArmaduraCheckers.puedeUsarDefensaSinArmaduraMonje(
				estadoEquipo.armaduraEquipada(),
				estadoEquipo.escudoEquipado(),
				habilidades
		)) {
			return 10 + modificadores.destreza() + modificadores.sabiduria();
		}

		if (DndArmaduraCheckers.puedeUsarDefensaSinArmaduraBarbaro(estadoEquipo.armaduraEquipada(), habilidades)) {
			armorClass = 10 + modificadores.destreza() + modificadores.constitucion();
		}

		if (DndArmaduraCheckers.tieneResilienciaDraconicaSinArmadura(estadoEquipo.armaduraEquipada(), habilidades)) {
			armorClass = Math.max(armorClass, 13 + modificadores.destreza());
		}

		return armorClass;
	}

	private record ModificadoresCaracteristica(int destreza, int constitucion, int sabiduria) {}

	private record EstadoEquipoArmadura(
			int claseArmaduraBase,
			int bonoEscudo,
			boolean armaduraEquipada,
			boolean escudoEquipado
	) {}
}