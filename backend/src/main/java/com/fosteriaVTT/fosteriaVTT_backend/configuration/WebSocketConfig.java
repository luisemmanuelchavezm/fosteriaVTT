package com.fosteriaVTT.fosteriaVTT_backend.configuration;

import java.util.Arrays;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketTransportRegistration;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final WebSocketAuthChannelInterceptor webSocketAuthChannelInterceptor;
    private final String[] allowedOrigins;

    public WebSocketConfig(
            WebSocketAuthChannelInterceptor webSocketAuthChannelInterceptor,
            @Value("${app.cors.allowed-origins:}") String allowedOrigins
    ) {
        this.webSocketAuthChannelInterceptor = webSocketAuthChannelInterceptor;
        this.allowedOrigins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .toArray(String[]::new);
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        String[] origins = allowedOrigins.length > 0 ? allowedOrigins : new String[] { "*" };

        registry.addEndpoint("/ws")
            .setAllowedOriginPatterns(origins);

        registry.addEndpoint("/ws-sockjs")
            .setAllowedOriginPatterns(origins)
            .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(webSocketAuthChannelInterceptor);
    }

    /**
     * Raise the default inbound STOMP frame limit (64 KB) so that large fog-of-war
     * batch messages sent at the end of a fast drag are never silently dropped.
     * 512 KB comfortably handles a full 100×100 grid explored in one drag.
     */
    @Override
    public void configureWebSocketTransport(WebSocketTransportRegistration registration) {
        registration.setMessageSizeLimit(512 * 1024);   // 512 KB inbound
        registration.setSendBufferSizeLimit(1024 * 1024); // 1 MB outbound
        registration.setSendTimeLimit(20_000);            // 20 s send timeout
    }
}
