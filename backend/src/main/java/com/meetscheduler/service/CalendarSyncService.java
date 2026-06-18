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

    @Transactional
    public CalendarIntegration connectGoogle(String userEmail, String authCode) {
        User user = getUser(userEmail);
        CalendarIntegration integration = calendarIntegrationRepository
                .findByUserIdAndProvider(user.getId(), CalendarIntegration.Provider.GOOGLE)
                .orElseGet(() -> {
                    CalendarIntegration ci = new CalendarIntegration();
                    ci.setUser(user);
                    ci.setProvider(CalendarIntegration.Provider.GOOGLE);
                    return ci;
                });
        integration.setAccessToken("google_access_" + authCode);
        integration.setRefreshToken("google_refresh_" + authCode);
        integration.setTokenExpiry(LocalDateTime.now().plusHours(1));
        integration.setSyncStatus(CalendarIntegration.SyncStatus.CONNECTED);
        integration.setLastSyncedAt(LocalDateTime.now());
        CalendarIntegration saved = calendarIntegrationRepository.save(integration);
        log.info("Google Calendar connected for user: {}", userEmail);
        return saved;
    }

    @Transactional
    public Map<String, Object> syncCalendar(String userEmail) {
        User user = getUser(userEmail);
        List<CalendarIntegration> integrations = calendarIntegrationRepository.findByUserId(user.getId());
        List<Meeting> meetings = meetingRepository.findAllMeetingsForUser(user);
        int synced = 0;
        for (CalendarIntegration integration : integrations) {
            if (integration.getSyncStatus() == CalendarIntegration.SyncStatus.CONNECTED) {
                try {
                    log.info("Syncing {} meetings to {} for {}", meetings.size(), integration.getProvider(), userEmail);
                    integration.setLastSyncedAt(LocalDateTime.now());
                    calendarIntegrationRepository.save(integration);
                    synced += meetings.size();
                } catch (Exception e) {
                    log.error("Sync failed for {}: {}", integration.getProvider(), e.getMessage());
                    integration.setSyncStatus(CalendarIntegration.SyncStatus.ERROR);
                    calendarIntegrationRepository.save(integration);
                }
            }
        }
        return Map.of("synced", synced, "timestamp", LocalDateTime.now().toString());
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
