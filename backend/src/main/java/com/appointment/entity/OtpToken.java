package com.appointment.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Stores OTP tokens for the Forgot Password flow.
 * Each OTP is single-use and expires after 5 minutes.
 */
@Entity
@Table(name = "otp_tokens")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OtpToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "otp", nullable = false, length = 6)
    private String otp;

    @Column(name = "expiry_time", nullable = false)
    private LocalDateTime expiryTime;

    @Column(name = "used", nullable = false)
    @Builder.Default
    private Boolean used = false;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /** Returns true if this OTP has passed its expiry time */
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiryTime);
    }
}
