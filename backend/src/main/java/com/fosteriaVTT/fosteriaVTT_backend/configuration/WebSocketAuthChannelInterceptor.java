package com.fosteriaVTT.fosteriaVTT_backend.configuration;

import com.fosteriaVTT.fosteriaVTT_backend.Jugador.JugadorRepository;
import com.fosteriaVTT.fosteriaVTT_backend.auth.CustomUserDetailsService;
import java.security.Principal;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

@Component
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {

    private static final Pattern CAMPAIGN_DESTINATION_PATTERN =
            Pattern.compile("^/(topic|app)/campanas/(\\d+)/(chat|jugadores)(/enviar)?$");

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;
    private final JugadorRepository jugadorRepository;

    public WebSocketAuthChannelInterceptor(
            JwtUtil jwtUtil,
            CustomUserDetailsService userDetailsService,
            JugadorRepository jugadorRepository
    ) {
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
        this.jugadorRepository = jugadorRepository;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || accessor.getCommand() == null) {
            return message;
        }

        StompCommand command = accessor.getCommand();
        if (StompCommand.CONNECT.equals(command)) {
            authenticateConnect(accessor);
            return message;
        }

        if (StompCommand.SUBSCRIBE.equals(command) || StompCommand.SEND.equals(command)) {
            authorizeCampaignDestination(accessor);
        }

        return message;
    }

    private void authenticateConnect(StompHeaderAccessor accessor) {
        String authorizationHeader = firstHeader(accessor, "Authorization");
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw new AccessDeniedException("Falta token Bearer en conexión WebSocket");
        }

        String token = authorizationHeader.substring(7);
        String username = jwtUtil.extractUsername(token);
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
        if (!jwtUtil.validateToken(token, userDetails)) {
            throw new AccessDeniedException("Token JWT inválido para conexión WebSocket");
        }

        Authentication authentication =
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        accessor.setUser(authentication);

        Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
        if (sessionAttributes == null) {
            return;
        }

        sessionAttributes.put("username", username);

        String campaignIdHeader = firstHeader(accessor, "campaignId");
        Long campaignId = parsePositiveLong(campaignIdHeader);
        if (campaignId != null) {
            sessionAttributes.put("campaignId", campaignId);
        }
    }

    private void authorizeCampaignDestination(StompHeaderAccessor accessor) {
        String destination = accessor.getDestination();
        if (destination == null || destination.isBlank()) {
            return;
        }

        Long campaignId = extractCampaignId(destination);
        if (campaignId == null) {
            return;
        }

        Authentication authentication = extractAuthentication(accessor.getUser());
        String username = authentication.getName();

        boolean belongsToCampaign = jugadorRepository.buscarPorUsuarioYCampaniaId(username, campaignId).isPresent();
        if (!belongsToCampaign) {
            throw new AccessDeniedException("No tienes acceso a esta campaña");
        }

        Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
        if (sessionAttributes != null) {
            sessionAttributes.put("campaignId", campaignId);
            sessionAttributes.put("username", username);
        }
    }

    private Authentication extractAuthentication(Principal principal) {
        if (principal instanceof Authentication authentication) {
            return authentication;
        }

        throw new AccessDeniedException("Conexión WebSocket no autenticada");
    }

    private String firstHeader(StompHeaderAccessor accessor, String name) {
        String value = accessor.getFirstNativeHeader(name);
        if (value != null && !value.isBlank()) {
            return value;
        }

        String lowerCaseValue = accessor.getFirstNativeHeader(name.toLowerCase());
        return lowerCaseValue == null || lowerCaseValue.isBlank() ? null : lowerCaseValue;
    }

    private Long extractCampaignId(String destination) {
        Matcher matcher = CAMPAIGN_DESTINATION_PATTERN.matcher(destination);
        if (!matcher.matches()) {
            return null;
        }

        return parsePositiveLong(matcher.group(2));
    }

    private Long parsePositiveLong(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        try {
            long parsed = Long.parseLong(value);
            return parsed > 0 ? parsed : null;
        } catch (NumberFormatException ignored) {
            return null;
        }
    }
}
