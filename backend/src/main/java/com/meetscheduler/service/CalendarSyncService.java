package com.meetscheduler.service;

import com.meetscheduler.entity.CalendarIntegration;
import com.meetscheduler.entity.Meeting;
import com.meetscheduler.entity.User;
import com.meetscheduler.repository.CalendarIntegrationRepository;
import com.meetscheduler.repository.MeetingRepository;
import com.meetscheduler.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@Service
public class CalendarSyncService {

    private static final Logger log = LoggerFactory.getLogger(CalendarSyncService.class);

    private final CalendarIntegrationRepository calendarIntegrationRepository;
    private final UserRepository userRepository;
    private final MeetingRepository meetingRepository;

    @Value("${google.client.id}")
    private String googleClientId;

    @Value("${google.redirect.uri}")
    private String googleRedirectUri;

    public CalendarSyncService(CalendarIntegrationRepository calendarIntegrationRepository,
                                UserRepository userRepository,
                                MeetingRepository meetingRepository) {
        this.calendarIntegrationRepository = calendarIntegrationRepository;
        this.userRepository = userRepository;
        this.meetingRepository = meetingRepository;
    }

    public String getGoogleAuthUrl() {
        return "https://accounts.google.com/o/oauth2/v2/auth?client_id=" + googleClientId
                + "&redirect_uri=" + googleRedirectUri
                + "&response_type=code"
                + "&scope=https://www.googleapis.com/auth/calendar"
                + "&access_type=offline&prompt=consent";
    }

    /**
     * OAuth integration is not implemented yet. Never fabricate access tokens or
     * claim that calendar events were synchronized.
     */
    public CalendarIntegration connectGoogle(String userEmail, String authCode) {
        throw new UnsupportedOperationException("Google OAuth token exchange is not configured");
    }

    public Map<String, Object> syncCalendar(String userEmail) {
        throw new UnsupportedOperationException("Google Calendar synchronization is not configured");
    }

    @Transactional
    public void disconnectProvider(String userEmail, String provider) {
        User user = getUser(userEmail);
        calendarIntegrationRepository
                .findByUserIdAndProvider(user.getId(), CalendarIntegration.Provider.GOOGLE)
                .ifPresent(i -> {
                    i.setSyncStatus(CalendarIntegration.SyncStatus.DISCONNECTED);
                    calendarIntegrationRepository.save(i);
                });
    }

    @Transactional(readOnly = true)
    public List<CalendarIntegration> getUserIntegrations(String userEmail) {
        User user = getUser(userEmail);
        return calendarIntegrationRepository.findByUserId(user.getId());
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + email));
    }
}
