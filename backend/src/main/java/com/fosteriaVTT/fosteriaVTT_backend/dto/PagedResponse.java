package com.fosteriaVTT.fosteriaVTT_backend.dto;

import java.util.List;

public record PagedResponse<T>(
        List<T> items,
        boolean hasMore
) {
}