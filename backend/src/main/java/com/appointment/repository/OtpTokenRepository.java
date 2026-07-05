package com.appointment.repository;

import com.appointment.entity.OtpToken;
import com.appointment.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OtpTokenRepository extends JpaRepository<OtpToken, Long> {

    /** Find the most recent unused, non-expired OTP for the given user+code */
    Optional<OtpToken> findTopByUserAndOtpAndUsedFalseOrderByCreatedAtDesc(User user, String otp);

    /** Count OTP requests by this user since a given time (for rate limiting) */
    long countByUserAndCreatedAtAfter(User user, LocalDateTime since);

    /** Delete all expired tokens (used by cleanup scheduler) */
    @Modifying
    @Query("DELETE FROM OtpToken o WHERE o.expiryTime < :now")
    void deleteExpiredTokens(@Param("now") LocalDateTime now);

    /** Get all tokens for a user (for max-attempts tracking) */
    List<OtpToken> findByUserAndUsedFalseAndExpiryTimeAfter(User user, LocalDateTime now);
}
