package com.gis.platform.config;

import com.gis.platform.service.AuthService;
import com.gis.platform.service.TemplateService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {
    private final AuthService authService;
    private final TemplateService templateService;

    public DataInitializer(AuthService authService, TemplateService templateService) {
        this.authService = authService;
        this.templateService = templateService;
    }

    @Override
    public void run(String... args) {
        authService.ensureDefaultAdmin();
        templateService.ensurePresetTemplates();
    }
}
