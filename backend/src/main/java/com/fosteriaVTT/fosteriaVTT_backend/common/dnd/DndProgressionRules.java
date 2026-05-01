package com.fosteriaVTT.fosteriaVTT_backend.common.dnd;

import com.fosteriaVTT.fosteriaVTT_backend.common.TagUtils;
import java.util.Map;
import java.util.Set;

public final class DndProgressionRules {

	private static final Map<Integer, int[]> MULTICLASS_SPELL_SLOTS = Map.ofEntries(
			Map.entry(1, new int[]{2}),
			Map.entry(2, new int[]{3}),
			Map.entry(3, new int[]{4, 2}),
			Map.entry(4, new int[]{4, 3}),
			Map.entry(5, new int[]{4, 3, 2}),
			Map.entry(6, new int[]{4, 3, 3}),
			Map.entry(7, new int[]{4, 3, 3, 1}),
			Map.entry(8, new int[]{4, 3, 3, 2}),
			Map.entry(9, new int[]{4, 3, 3, 3, 1}),
			Map.entry(10, new int[]{4, 3, 3, 3, 2}),
			Map.entry(11, new int[]{4, 3, 3, 3, 2, 1}),
			Map.entry(12, new int[]{4, 3, 3, 3, 2, 1}),
			Map.entry(13, new int[]{4, 3, 3, 3, 2, 1, 1}),
			Map.entry(14, new int[]{4, 3, 3, 3, 2, 1, 1}),
			Map.entry(15, new int[]{4, 3, 3, 3, 2, 1, 1, 1}),
			Map.entry(16, new int[]{4, 3, 3, 3, 2, 1, 1, 1}),
			Map.entry(17, new int[]{4, 3, 3, 3, 2, 1, 1, 1, 1}),
			Map.entry(18, new int[]{4, 3, 3, 3, 3, 1, 1, 1, 1}),
			Map.entry(19, new int[]{4, 3, 3, 3, 3, 2, 1, 1, 1}),
			Map.entry(20, new int[]{4, 3, 3, 3, 3, 2, 2, 1, 1})
	);

	private static final Set<Integer> STANDARD_ASI_LEVELS = Set.of(4, 8, 12, 16, 19);
	private static final Set<Integer> FIGHTER_ASI_LEVELS = Set.of(4, 6, 8, 12, 14, 16, 19);
	private static final Set<Integer> ROGUE_ASI_LEVELS = Set.of(4, 8, 10, 12, 16, 19);

	private DndProgressionRules() {}

	public static boolean isAbilityScoreImprovementLevel(String classId, int level) {
		String normalized = TagUtils.normalizeText(classId);
		if (normalized.equals(TagUtils.normalizeText("guerrero"))) {
			return FIGHTER_ASI_LEVELS.contains(level);
		}
		if (normalized.equals(TagUtils.normalizeText("picaro"))) {
			return ROGUE_ASI_LEVELS.contains(level);
		}
		return STANDARD_ASI_LEVELS.contains(level);
	}

	public static int[] getMulticlassSpellSlots(int casterLevel) {
		int[] slots = MULTICLASS_SPELL_SLOTS.getOrDefault(Math.min(20, Math.max(0, casterLevel)), new int[0]);
		return java.util.Arrays.copyOf(slots, slots.length);
	}
}