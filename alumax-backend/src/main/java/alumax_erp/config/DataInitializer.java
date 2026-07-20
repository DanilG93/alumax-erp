package alumax_erp.config;

import alumax_erp.entity.Role;
import alumax_erp.entity.User;
import alumax_erp.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initDatabase(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (userRepository.count() == 0) {
                User admin = new User();
                admin.setUsername("admin");
                admin.setPassword(passwordEncoder.encode("admin123")); // Automatski kriptuje lozinku
                admin.setRole(Role.HEAD_ADMIN);
                userRepository.save(admin);
                System.out.println("Kreiran default korisnik -> Username: admin | Password: admin123");
            }
        };
    }
}