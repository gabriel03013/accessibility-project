package com.example.acessibility.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class SwaggerBrowserLauncher {

    @Value("${app.swagger.open-on-startup:false}")
    private boolean openOnStartup;

    @Value("${server.port:8080}")
    private String serverPort;

    @EventListener(ApplicationReadyEvent.class)
    public void openSwagger() {
        if (!openOnStartup) {
            return;
        }

        String swaggerUrl =
                "http://localhost:" + serverPort + "/swagger-ui/index.html";

        try {
            System.out.println("Abrindo Swagger em: " + swaggerUrl);

            new ProcessBuilder(
                    "cmd.exe",
                    "/c",
                    "start",
                    "",
                    swaggerUrl
            ).start();
        } catch (Exception exception) {
            System.out.println(
                    "Não foi possível abrir o Swagger automaticamente: "
                            + exception.getMessage()
            );
        }
    }
}