package com.fosteriaVTT.fosteriaVTT_backend.auth;

import com.sendgrid.*;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
public class SendGridEmailService {

    @Value("${sendgrid.api-key}")
    private String apiKey;

    @Value("${sendgrid.from-email}")
    private String fromEmail;

    @Value("${sendgrid.from-name}")
    private String fromName;

    public void sendResetCode(String toEmail, String username, String code) {
        Email from = new Email(fromEmail, fromName);
        Email to = new Email(toEmail);
        String subject = "Código de recuperación - FosteriaVTT";
        String body = """
                <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#1a1a1a;color:#f5f5f5;border-radius:12px;">
                  <h2 style="color:#f59e0b;margin-top:0;">FosteriaVTT</h2>
                  <p>Hola <strong>%s</strong>,</p>
                  <p>Tu código de recuperación de contraseña es:</p>
                  <div style="font-size:36px;font-weight:bold;letter-spacing:12px;text-align:center;padding:16px;background:#2a2a2a;border-radius:8px;color:#f59e0b;margin:16px 0;">
                    %s
                  </div>
                  <p style="color:#aaa;font-size:13px;">Este código expira en <strong>30 minutos</strong> y solo puede usarse una vez.</p>
                  <p style="color:#aaa;font-size:13px;">Si no solicitaste este código, ignora este mensaje.</p>
                </div>
                """.formatted(username, code);

        Content content = new Content("text/html", body);
        Mail mail = new Mail(from, subject, to, content);

        SendGrid sg = new SendGrid(apiKey);
        Request request = new Request();
        try {
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());
            sg.api(request);
        } catch (IOException e) {
            throw new RuntimeException("No se pudo enviar el email de recuperación", e);
        }
    }
}
