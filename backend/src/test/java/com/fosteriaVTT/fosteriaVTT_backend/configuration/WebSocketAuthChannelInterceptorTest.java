package com.fosteriaVTT.fosteriaVTT_backend.configuration;

import com.fosteriaVTT.fosteriaVTT_backend.Jugador.Jugador;
import com.fosteriaVTT.fosteriaVTT_backend.Jugador.JugadorRepository;
import com.fosteriaVTT.fosteriaVTT_backend.auth.CustomUserDetailsService;
import java.security.Principal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WebSocketAuthChannelInterceptorTest {

    private static final String SIGNING_KEY = "abcdefghijklmnopqrstuvwxyz012345";
    private static final JwtUtil JWT_UTIL = new JwtUtil(SIGNING_KEY, 3_600_000);

    @Mock
    CustomUserDetailsService userDetailsService;

    @Mock
    JugadorRepository jugadorRepository;

    @Mock
    MessageChannel channel;

    WebSocketAuthChannelInterceptor interceptor;

    @BeforeEach
    void setUp() {
        interceptor = new WebSocketAuthChannelInterceptor(JWT_UTIL, userDetailsService, jugadorRepository);
    }

    // ── accessor null / sin comando → pass-through ────────────────────────────

    @Test
    void preSend_mensajeSinAccessor_retornaMensajeIntacto() {
        Message<byte[]> plainMsg = MessageBuilder.withPayload(new byte[0]).build();
        Message<?> result = interceptor.preSend(plainMsg, channel);
        assertSame(plainMsg, result);
    }

    // ── CONNECT: token válido ─────────────────────────────────────────────────

    @Test
    void preSend_connectConTokenValido_estableceUsuarioEnAccessor() {
        UserDetails userDetails = new User("sai", "pw", List.of());
        String token = JWT_UTIL.generateToken(userDetails);
        when(userDetailsService.loadUserByUsername("sai")).thenReturn(userDetails);

        StompHeaderAccessor accessor = stompAccessor(StompCommand.CONNECT);
        accessor.addNativeHeader("Authorization", "Bearer " + token);
        accessor.setSessionAttributes(new HashMap<>());
        accessor.setLeaveMutable(true);
        Message<byte[]> msg = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        interceptor.preSend(msg, channel);

        assertNotNull(accessor.getUser());
        assertEquals("sai", accessor.getUser().getName());
    }

    @Test
    void preSend_connectConTokenValidoYCampaignId_almacenaCampaignIdEnSesion() {
        UserDetails userDetails = new User("sai", "pw", List.of());
        String token = JWT_UTIL.generateToken(userDetails);
        when(userDetailsService.loadUserByUsername("sai")).thenReturn(userDetails);

        Map<String, Object> session = new HashMap<>();
        StompHeaderAccessor accessor = stompAccessor(StompCommand.CONNECT);
        accessor.addNativeHeader("Authorization", "Bearer " + token);
        accessor.addNativeHeader("campaignId", "42");
        accessor.setSessionAttributes(session);
        accessor.setLeaveMutable(true);
        Message<byte[]> msg = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        interceptor.preSend(msg, channel);

        assertEquals(42L, session.get("campaignId"));
        assertEquals("sai", session.get("username"));
    }

    @Test
    void preSend_connectConCampaignIdNoNumerico_noAlmacenaCampaignId() {
        UserDetails userDetails = new User("sai", "pw", List.of());
        String token = JWT_UTIL.generateToken(userDetails);
        when(userDetailsService.loadUserByUsername("sai")).thenReturn(userDetails);

        Map<String, Object> session = new HashMap<>();
        StompHeaderAccessor accessor = stompAccessor(StompCommand.CONNECT);
        accessor.addNativeHeader("Authorization", "Bearer " + token);
        accessor.addNativeHeader("campaignId", "noanumber");
        accessor.setSessionAttributes(session);
        accessor.setLeaveMutable(true);
        Message<byte[]> msg = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        interceptor.preSend(msg, channel);

        assertNull(session.get("campaignId"));
    }

    @Test
    void preSend_connectConCampaignIdNegativo_noAlmacenaCampaignId() {
        UserDetails userDetails = new User("sai", "pw", List.of());
        String token = JWT_UTIL.generateToken(userDetails);
        when(userDetailsService.loadUserByUsername("sai")).thenReturn(userDetails);

        Map<String, Object> session = new HashMap<>();
        StompHeaderAccessor accessor = stompAccessor(StompCommand.CONNECT);
        accessor.addNativeHeader("Authorization", "Bearer " + token);
        accessor.addNativeHeader("campaignId", "-5");
        accessor.setSessionAttributes(session);
        accessor.setLeaveMutable(true);
        Message<byte[]> msg = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        interceptor.preSend(msg, channel);

        assertNull(session.get("campaignId"));
    }

    // ── CONNECT: sin token → AccessDeniedException ────────────────────────────

    @Test
    void preSend_connectSinCabeceraAuth_lanzaAccessDeniedException() {
        StompHeaderAccessor accessor = stompAccessor(StompCommand.CONNECT);
        Message<byte[]> msg = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        assertThrows(AccessDeniedException.class, () -> interceptor.preSend(msg, channel));
    }

    @Test
    void preSend_connectConCabeceraSinBearer_lanzaAccessDeniedException() {
        StompHeaderAccessor accessor = stompAccessor(StompCommand.CONNECT);
        accessor.addNativeHeader("Authorization", "Basic dXNlcjpwYXNz");
        Message<byte[]> msg = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        assertThrows(AccessDeniedException.class, () -> interceptor.preSend(msg, channel));
    }

    // ── SUBSCRIBE: destino de campaña autorizado ──────────────────────────────

    @Test
    void preSend_subscribeDestinosCampaniaAutorizado_retornaMensaje() {
        Authentication auth = authFor("sai");
        when(jugadorRepository.buscarPorUsuarioYCampaniaId("sai", 42L))
                .thenReturn(Optional.of(mock(Jugador.class)));

        String[] destinations = {
            "/topic/campanas/42/chat",
            "/topic/campanas/42/jugadores",
            "/app/campanas/42/chat/enviar",
        };
        for (String dest : destinations) {
            StompHeaderAccessor accessor = stompAccessor(StompCommand.SUBSCRIBE);
            accessor.setDestination(dest);
            accessor.setUser(auth);
            accessor.setSessionAttributes(new HashMap<>());
            Message<byte[]> msg = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

            assertDoesNotThrow(() -> interceptor.preSend(msg, channel), "Falló para: " + dest);
        }
    }

    // ── SUBSCRIBE: no autorizado → AccessDeniedException ─────────────────────

    @Test
    void preSend_subscribeNoAutorizado_lanzaAccessDeniedException() {
        Authentication auth = authFor("sai");
        when(jugadorRepository.buscarPorUsuarioYCampaniaId("sai", 99L))
                .thenReturn(Optional.empty());

        StompHeaderAccessor accessor = stompAccessor(StompCommand.SUBSCRIBE);
        accessor.setDestination("/topic/campanas/99/chat");
        accessor.setUser(auth);
        Message<byte[]> msg = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        assertThrows(AccessDeniedException.class, () -> interceptor.preSend(msg, channel));
    }

    // ── SUBSCRIBE: destino no de campaña → pass-through ──────────────────────

    @Test
    void preSend_subscribeDestinoNoCampana_noChequeaRepositorio() {
        StompHeaderAccessor accessor = stompAccessor(StompCommand.SUBSCRIBE);
        accessor.setDestination("/topic/otro");
        Message<byte[]> msg = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        assertDoesNotThrow(() -> interceptor.preSend(msg, channel));
        verifyNoInteractions(jugadorRepository);
    }

    @Test
    void preSend_subscribeDestinoNull_noChequeaRepositorio() {
        StompHeaderAccessor accessor = stompAccessor(StompCommand.SUBSCRIBE);
        Message<byte[]> msg = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        assertDoesNotThrow(() -> interceptor.preSend(msg, channel));
        verifyNoInteractions(jugadorRepository);
    }

    // ── SUBSCRIBE: principal no es Authentication → AccessDeniedException ─────

    @Test
    void preSend_subscribeConPrincipalNoAuthentication_lanzaAccessDeniedException() {
        Principal nonAuthPrincipal = () -> "testuser";

        StompHeaderAccessor accessor = stompAccessor(StompCommand.SUBSCRIBE);
        accessor.setDestination("/topic/campanas/42/chat");
        accessor.setUser(nonAuthPrincipal);
        Message<byte[]> msg = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        assertThrows(AccessDeniedException.class, () -> interceptor.preSend(msg, channel));
    }

    // ── SEND: mismo comportamiento que SUBSCRIBE ──────────────────────────────

    @Test
    void preSend_sendDestinosCampaniaAutorizado_retornaMensaje() {
        Authentication auth = authFor("sai");
        when(jugadorRepository.buscarPorUsuarioYCampaniaId("sai", 10L))
                .thenReturn(Optional.of(mock(Jugador.class)));

        StompHeaderAccessor accessor = stompAccessor(StompCommand.SEND);
        accessor.setDestination("/app/campanas/10/chat/enviar");
        accessor.setUser(auth);
        accessor.setSessionAttributes(new HashMap<>());
        Message<byte[]> msg = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        assertDoesNotThrow(() -> interceptor.preSend(msg, channel));
        verify(jugadorRepository).buscarPorUsuarioYCampaniaId("sai", 10L);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private StompHeaderAccessor stompAccessor(StompCommand command) {
        return StompHeaderAccessor.create(command);
    }

    private Authentication authFor(String username) {
        UserDetails ud = new User(username, "pw", List.of());
        return new UsernamePasswordAuthenticationToken(ud, null, ud.getAuthorities());
    }
}
