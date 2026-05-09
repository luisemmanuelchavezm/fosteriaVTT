package com.fosteriaVTT.fosteriaVTT_backend.Estadistica.dnd;

import com.fosteriaVTT.fosteriaVTT_backend.Habilidad.Habilidad;
import com.fosteriaVTT.fosteriaVTT_backend.Mochila.Mochila;
import com.fosteriaVTT.fosteriaVTT_backend.Objeto.Objeto;
import com.fosteriaVTT.fosteriaVTT_backend.Objeto.TipoObjeto;
import com.fosteriaVTT.fosteriaVTT_backend.common.TagUtils;
import java.util.List;

public final class DndArmaduraCheckers {

	private DndArmaduraCheckers() {}

	public static boolean esArmaduraEquipada(Mochila item) {
		if (item == null || !item.isEquipado()) {
			return false;
		}

		Objeto objeto = item.getObjeto();
		return objeto != null && objeto.getTipoObjeto() == TipoObjeto.ARMADURA;
	}

	public static boolean tieneHabilidad(List<Habilidad> habilidades, String nombre) {
		String normalizedName = TagUtils.normalizeText(nombre);
		return (habilidades == null ? List.<Habilidad>of() : habilidades).stream()
				.anyMatch(habilidad -> TagUtils.normalizeText(habilidad.getNombre()).equals(normalizedName));
	}

	public static boolean tieneHabilidadDeClase(List<Habilidad> habilidades, String nombre, String clase) {
		String normalizedName = TagUtils.normalizeText(nombre);
		String normalizedClassTag = TagUtils.normalizeText("C" + clase);
		return (habilidades == null ? List.<Habilidad>of() : habilidades).stream()
				.anyMatch(habilidad -> TagUtils.normalizeText(habilidad.getNombre()).equals(normalizedName)
						&& TagUtils.normalizeText(habilidad.getTags()).contains(normalizedClassTag));
	}

	public static boolean puedeUsarDefensaSinArmaduraMonje(
			boolean armaduraEquipada,
			boolean escudoEquipado,
			List<Habilidad> habilidades
	) {
		return !armaduraEquipada
				&& !escudoEquipado
				&& tieneHabilidadDeClase(habilidades, "Defensa sin armadura", "monje");
	}

	public static boolean puedeUsarDefensaSinArmaduraBarbaro(boolean armaduraEquipada, List<Habilidad> habilidades) {
		return !armaduraEquipada
				&& tieneHabilidadDeClase(habilidades, "Defensa sin armadura", "barbaro");
	}

	public static boolean tieneResilienciaDraconicaSinArmadura(boolean armaduraEquipada, List<Habilidad> habilidades) {
		return !armaduraEquipada && tieneHabilidad(habilidades, "Resiliencia draconica");
	}

	public static boolean tieneEstiloDefensaConArmadura(boolean armaduraEquipada, List<Habilidad> habilidades) {
		return armaduraEquipada && tieneHabilidad(habilidades, "Estilo de combate: Defensa");
	}
}