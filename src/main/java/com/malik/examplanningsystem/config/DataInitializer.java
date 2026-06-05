package com.malik.examplanningsystem.config;

import com.malik.examplanningsystem.entity.Role;
import com.malik.examplanningsystem.entity.User;
import com.malik.examplanningsystem.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        if (userRepository.count() == 0) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setPasswordHash(passwordEncoder.encode("admin123"));
            admin.setRole(Role.ADMIN);
            userRepository.save(admin);

            log.warn("==========================================================");
            log.warn("  Default admin account created.");
            log.warn("  Username : admin");
            log.warn("  Password : admin123");
            log.warn("  Change this password immediately after first login.");
            log.warn("==========================================================");
        }
    }
}
