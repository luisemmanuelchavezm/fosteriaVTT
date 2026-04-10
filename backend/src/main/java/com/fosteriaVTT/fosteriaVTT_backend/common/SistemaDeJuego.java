package com.fosteriaVTT.fosteriaVTT_backend.common;

public enum SistemaDeJuego {
    DND("Dungeons and Dragons"),
    COC("Call Of Cthulhu"),
    VAMPIRE("Vampire: The Masquerade");

    private final String displayName;

    SistemaDeJuego(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
