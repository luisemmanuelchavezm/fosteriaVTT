package com.fosteriaVTT.fosteriaVTT_backend.common.dnd;

import java.util.regex.Pattern;

public final class DndPatterns {

	public static final Pattern KNOWN_CANTRIP_PATTERN = Pattern.compile("conoces(?:\\s+el\\s+truco)?\\s+([a-zA-Záéíóúñ'\\- ]+?)(?:[.;]|$)", Pattern.CASE_INSENSITIVE);
	public static final Pattern CAST_SPELL_PATTERN = Pattern.compile("puedes\\s+lanzar\\s+([a-zA-Záéíóúñ'\\- ]+?)(?:\\s+como conjuro|\\s+una vez|[.;]|$)", Pattern.CASE_INSENSITIVE);
	public static final String FEAT_COMPETENCY_PREFIX = "Competencia dote: ";
	public static final String FEAT_LANGUAGE_PREFIX = "Idioma dote: ";
	public static final String RACIAL_SPELL_TAG = "DND,RAZA,CONJURO";
	public static final String TIEFLING_RACE_ID = "tiefling";
	public static final String WEAPON_OBJECT_TAG = "OBJETO";

	private DndPatterns() {}
}