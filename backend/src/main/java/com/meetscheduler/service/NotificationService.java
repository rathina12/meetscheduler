package com.meetscheduler.service;

import com.meetscheduler.entity.Meeting;
import com.meetscheduler.entity.Notification;
import com.meetscheduler.entity.Participant;
import com.meetscheduler.repository.MeetingRepository;
import com.meetscheduler.repository.NotificationRepository;
import com.meetscheduler.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository notificationRepository;
    private final MeetingRepository meetingRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final SimpMessagingTemplate messagingTemplate;

    public NotificationService(NotificationRepository notificationRepository,
                                MeetingRepository meetingRepository,
                                UserRepository userRepository,
                                EmailService emailService,
                                SimpMessagingTemplate messagingTemplate) {
        this.notificationRepository = notificationRepository;
        this.meetingRepository = meetingRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional(readOnly = true)
    public List<Notification> getUserNotifications(String userEmail) {
        var user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NoSuchElementException("User not found"));
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(String userEmail) {
        var user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NoSuchElementException("User not found"));
        return notificationRepository.countByUserIdAndReadStatusFalse(user.getId());
    }

    @Transactional
    public void markAsRead(Long notificationId, String userEmail) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new NoSuchElementException("Notification not found"));
        var user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NoSuchElementException("User not found"));
        if (n.getUser() == null || !user.getId().equals(n.getUser().getId())) {
            throw new AccessDeniedException("Cannot modify another user's notification");
        }
        n.setReadStatus(true);
        notificationRepository.save(n);
    }

    @Transactional
    public void markAllAsRead(String userEmail) {
        var user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NoSuchElementException("User not found"));
        notificationRepository.markAllAsReadByUserId(user.getId());
    }

    @Scheduled(fixedRate = 300000, initialDelay = 120000)
    public void sendMeetingReminders() {
        try {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime window = now.plusMinutes(15);
            meetingRepository.findAll().stream()
                    .filter(m -> m.getStatus() == Meeting.Status.SCHEDULED
                            && m.getStartTime() != null
                            && m.getStartTime().isAfter(now)
                            && m.getStartTime().isBefore(window))
                    .forEach(meeting -> {
                        try {
                            emailService.sendMeetingReminderEmail(meeting, meeting.getOrganizer().getEmail());
                        } catch (Exception e) {
                            log.warn("Reminder failed: {}", e.getMessage());
                        }
                        if (meeting.getParticipants() != null) {
                            meeting.getParticipants().stream()
                                    .filter(p -> p.getResponseStatus() != Participant.ResponseStatus.DECLINED)
                                    .forEach(p -> {
                                        try {
                                            emailService.sendMeetingReminderEmail(meeting, p.getEmail());
                                        } catch (Exception e) {
                                            log.warn("Reminder failed for {}: {}", p.getEmail(), e.getMessage());
                                        }
                                    });
                        }
                    });
        } catch (Exception e) {
            log.error("Reminder scheduler error: {}", e.getMessage());
        }
    }
}
