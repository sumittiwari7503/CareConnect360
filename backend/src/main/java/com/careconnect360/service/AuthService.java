package com.careconnect360.service;

import com.careconnect360.entity.Role;
import com.careconnect360.entity.User;
import com.careconnect360.repository.UserRepository;
import com.careconnect360.security.JwtTokenProvider;
import com.careconnect360.security.UserPrincipal;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuditEventService auditEventService;

    public AuthService(AuthenticationManager authenticationManager,
                       UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider tokenProvider,
                       AuditEventService auditEventService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.auditEventService = auditEventService;
    }

    public Map<String, Object> authenticate(String email, String password) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, password)
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();

        auditEventService.recordEvent(
                principal.getId(),
                principal.getAuthorities().iterator().next().getAuthority(),
                "USER_LOGIN",
                "USER:" + email,
                "SUCCESS",
                "{\"client\":\"CareConnect360-Web\"}"
        );

        return Map.of(
                "token", jwt,
                "tokenType", "Bearer",
                "userId", principal.getId(),
                "email", principal.getUsername(),
                "fullName", principal.getFullName(),
                "role", principal.getAuthorities().iterator().next().getAuthority()
        );
    }

    @Transactional
    public User registerPatient(String email, String rawPassword, String firstName, String lastName, String phone) {
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already in use: " + email);
        }

        String encodedPassword = passwordEncoder.encode(rawPassword);
        User user = new User(email, encodedPassword, firstName, lastName, phone, Role.ROLE_PATIENT);
        User saved = userRepository.save(user);

        auditEventService.recordEvent(
                saved.getId(),
                Role.ROLE_PATIENT.name(),
                "PATIENT_REGISTRATION",
                "USER:" + email,
                "SUCCESS",
                "{\"method\":\"SELF_REGISTRATION\"}"
        );

        return saved;
    }
}
