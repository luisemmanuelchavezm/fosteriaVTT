package com.fosteriaVTT.fosteriaVTT_backend.common;

import java.util.Arrays;
import java.util.Locale;
import java.util.Optional;

public enum SistemaDeJuego {
    DND("Dungeons and Dragons"),
    MORK_BORG("Mork Borg");

    private final String displayName;

    SistemaDeJuego(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    public static Optional<SistemaDeJuego> fromValue(String value) {
        if (value == null || value.isBlank()) {
            return Optional.empty();
        }

        String normalizedValue = value.trim().toLowerCase(Locale.ROOT);

        return Arrays.stream(values())
                .filter(system -> system.name().toLowerCase(Locale.ROOT).equals(normalizedValue)
                        || system.displayName.toLowerCase(Locale.ROOT).equals(normalizedValue))
                .findFirst();
    }
}
