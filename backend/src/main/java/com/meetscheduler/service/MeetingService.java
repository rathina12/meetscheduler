package com.meetscheduler.service;

import com.meetscheduler.entity.*;
import com.meetscheduler.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Service
public class MeetingService {

    private static final Logger log = LoggerFactory.getLogger(MeetingService.class);

    private final MeetingRepository meetingRepository;
    private final UserRepository userRepository;
    private final ParticipantRepository participantRepository;
    private final NotificationRepository notificationRepository;
    private final EmailService emailService;
    private final SimpMessagingTemplate messagingTemplate;

    public MeetingService(MeetingRepository meetingRepository, UserRepository userRepository,
                          ParticipantRepository participantRepository,
                          NotificationRepository notificationRepository,
                          EmailService emailService, SimpMessagingTemplate messagingTemplate) {
        this.meetingRepository = meetingRepository;
        this.userRepository = userRepository;
        this.participantRepository = participantRepository;
        this.notificationRepository = notificationRepository;
        this.emailService = emailService;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional(readOnly = true)
    public List<Meeting> getUserMeetings(String userEmail) {
        return meetingRepository.findAllMeetingsForUser(getUser(userEmail));
    }

    @Transactional(readOnly = true)
    public List<Meeting> getMeetingsByDateRange(String userEmail, LocalDateTime start, LocalDateTime end) {
        return meetingRepository.findMeetingsForUserBetween(getUser(userEmail), start, end);
    }

    @Transactional(readOnly = true)
    public List<Meeting> getTodayMeetings(String userEmail) {
        User user = getUser(userEmail);
        return meetingRepository.findMeetingsForUserBetween(user,
                LocalDate.now().atStartOfDay(), LocalDate.now().atTime(LocalTime.MAX));
    }

    @Transactional(readOnly = true)
    public List<Meeting> getUpcomingMeetings(String userEmail) {
        return meetingRepository.findUpcomingMeetings(getUser(userEmail), LocalDateTime.now());
    }

    @Transactional(readOnly = true)
    public Optional<Meeting> getMeetingById(Long id, String userEmail) {
        return meetingRepository.findById(id);
    }

    @Transactional
    public Meeting createMeeting(String title, String description,
                                  LocalDateTime startTime, LocalDateTime endTime,
                                  String location, Meeting.MeetingType meetingType,
                                  String meetingLink, List<String> participantEmails,
                                  Boolean isRecurring, Meeting.RecurrencePattern recurrencePattern,
                                  LocalDate recurrenceEndDate, String organizerEmail,
                                  Boolean forceCreate) {
        User organizer = getUser(organizerEmail);

        // Check conflicts — only WARN, don't block if forceCreate=true
        List<Meeting> conflicts = meetingRepository.findConflictingMeetings(
                organizer.getId(), startTime, endTime);
        if (!conflicts.isEmpty() && !Boolean.TRUE.equals(forceCreate)) {
            throw new IllegalStateException(
                "TIME_CONFLICT:" + conflicts.get(0).getTitle() +
                " at " + conflicts.get(0).getStartTime());
        }

        Meeting meeting = Meeting.builder()
                .title(title).description(description)
                .startTime(startTime).endTime(endTime).location(location)
                .meetingType(meetingType != null ? meetingType : Meeting.MeetingType.ONLINE)
                .meetingLink(meetingLink).organizer(organizer)
                .isRecurring(isRecurring != null && isRecurring)
                .recurrencePattern(recurrencePattern).recurrenceEndDate(recurrenceEndDate)
                .build();
        meeting = meetingRepository.save(meeting);

        if (participantEmails != null && !participantEmails.isEmpty()) {
            addParticipants(meeting, participantEmails);
        }

        saveNotification(organizer, meeting, Notification.NotificationType.MEETING_INVITE,
                "Meeting created: " + title);

        if (Boolean.TRUE.equals(isRecurring) && recurrencePattern != null && recurrenceEndDate != null) {
            createRecurringMeetings(meeting, recurrenceEndDate);
        }

        log.info("Meeting created: {} by {}", title, organizerEmail);
        return meeting;
    }

    @Transactional
    public Meeting updateMeeting(Long id, String title, String description,
                                  LocalDateTime startTime, LocalDateTime endTime,
                                  String location, Meeting.MeetingType meetingType,
                                  String meetingLink, String userEmail) {
        Meeting meeting = meetingRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Meeting not found: " + id));
        User user = getUser(userEmail);
        if (!meeting.getOrganizer().getId().equals(user.getId())) {
            throw new AccessDeniedException("Only the organizer can update this meeting");
        }

        if (title != null) meeting.setTitle(title);
        meeting.setDescription(description);
        if (startTime != null) meeting.setStartTime(startTime);
        if (endTime != null) meeting.setEndTime(endTime);
        meeting.setLocation(location);
        if (meetingType != null) meeting.setMeetingType(meetingType);
        meeting.setMeetingLink(meetingLink);
        // Keep status as SCHEDULED when updated (not RESCHEDULED)
        // Only change to RESCHEDULED if time actually changed
        if (startTime != null && !startTime.equals(meeting.getStartTime())) {
            meeting.setStatus(Meeting.Status.RESCHEDULED);
        }
        meeting = meetingRepository.save(meeting);

        // Notify all participants about the update
        final Meeting savedMeeting = meeting;
        if (meeting.getParticipants() != null) {
            meeting.getParticipants().forEach(p -> {
                if (p.getUser() != null) {
                    saveNotification(p.getUser(), savedMeeting,
                            Notification.NotificationType.MEETING_UPDATE,
                            "Meeting updated: " + savedMeeting.getTitle());
                    try {
                        messagingTemplate.convertAndSendToUser(p.getEmail(),
                                "/queue/notifications",
                                Map.of("type", "MEETING_UPDATE",
                                       "meetingId", savedMeeting.getId(),
                                       "message", "Meeting updated: " + savedMeeting.getTitle()));
                    } catch (Exception e) {
                        log.warn("WebSocket notify failed: {}", e.getMessage());
                    }
                }
            });
        }

        try { emailService.sendMeetingUpdateEmail(meeting); } catch (Exception e) {
            log.warn("Update email failed: {}", e.getMessage());
        }
        return meeting;
    }

    @Transactional
    public void cancelMeeting(Long id, String userEmail) {
        Meeting meeting = meetingRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Meeting not found: " + id));
        User user = getUser(userEmail);
        if (!meeting.getOrganizer().getId().equals(user.getId())) {
            throw new AccessDeniedException("Only the organizer can cancel this meeting");
        }
        meeting.setStatus(Meeting.Status.CANCELLED);
        meetingRepository.save(meeting);
        try { emailService.sendMeetingCancellationEmail(meeting); } catch (Exception e) {
            log.warn("Cancellation email failed: {}", e.getMessage());
        }
    }

    @Transactional
    public void deleteMeeting(Long id, String userEmail) {
        Meeting meeting = meetingRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Meeting not found: " + id));
        User user = getUser(userEmail);
        if (!meeting.getOrganizer().getId().equals(user.getId())) {
            throw new AccessDeniedException("Only the organizer can delete this meeting");
        }
        // Delete notifications referencing this meeting first
        try {
            notificationRepository.deleteByMeetingId(id);
        } catch (Exception e) {
            log.warn("Could not delete notifications for meeting {}: {}", id, e.getMessage());
        }
        meetingRepository.delete(meeting);
        log.info("Meeting {} deleted by {}", id, userEmail);
    }

    @Transactional
    public Participant respondToInvite(Long meetingId, String userEmail,
                                       Participant.ResponseStatus status) {
        User user = getUser(userEmail);

        // Try to find by meeting id and email
        Optional<Participant> participantOpt = participantRepository
                .findByMeetingIdAndEmail(meetingId, userEmail);

        Participant participant;
        if (participantOpt.isPresent()) {
            participant = participantOpt.get();
        } else {
            // User might be organizer responding — create a participant record for them
            Meeting meeting = meetingRepository.findById(meetingId)
                    .orElseThrow(() -> new NoSuchElementException("Meeting not found"));
            participant = Participant.builder()
                    .meeting(meeting).email(userEmail).user(user)
                    .responseStatus(Participant.ResponseStatus.PENDING)
                    .build();
            participant = participantRepository.save(participant);
        }

        participant.setResponseStatus(status);
        participant.setRespondedAt(LocalDateTime.now());
        participant = participantRepository.save(participant);

        Meeting meeting = participant.getMeeting();
        if (meeting.getOrganizer() != null &&
                !meeting.getOrganizer().getEmail().equals(userEmail)) {
            saveNotification(meeting.getOrganizer(), meeting,
                    Notification.NotificationType.RESPONSE_UPDATE,
                    user.getName() + " " + status.name().toLowerCase() +
                    " your meeting: " + meeting.getTitle());
        }
        return participant;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardStats(String userEmail) {
        User user = getUser(userEmail);
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime todayEnd = LocalDate.now().atTime(LocalTime.MAX);
        long total = meetingRepository.countMeetingsForUser(user);
        List<Meeting> todayMeetings = meetingRepository.findMeetingsForUserBetween(user, todayStart, todayEnd);
        List<Meeting> upcoming = meetingRepository.findUpcomingMeetings(user, now);
        long pendingInvites = participantRepository.countByUserIdAndResponseStatus(
                user.getId(), Participant.ResponseStatus.PENDING);

        List<Map<String, Object>> nextMeetings = upcoming.stream().limit(5).map(m -> {
            Map<String, Object> sm = new LinkedHashMap<>();
            sm.put("id", m.getId());
            sm.put("title", m.getTitle());
            sm.put("startTime", m.getStartTime() != null ? m.getStartTime().toString() : null);
            sm.put("endTime", m.getEndTime() != null ? m.getEndTime().toString() : null);
            sm.put("meetingType", m.getMeetingType() != null ? m.getMeetingType().name() : null);
            sm.put("status", m.getStatus() != null ? m.getStatus().name() : null);
            sm.put("location", m.getLocation());
            sm.put("meetingLink", m.getMeetingLink());
            sm.put("participantCount", m.getParticipants() != null ? m.getParticipants().size() : 0);
            if (m.getOrganizer() != null) {
                sm.put("organizer", Map.of(
                    "id", m.getOrganizer().getId(),
                    "name", m.getOrganizer().getName(),
                    "email", m.getOrganizer().getEmail()
                ));
            }
            return sm;
        }).toList();

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalMeetings", total);
        stats.put("todayMeetings", todayMeetings.size());
        stats.put("upcomingMeetings", upcoming.size());
        stats.put("pendingInvites", pendingInvites);
        stats.put("nextMeetings", nextMeetings);
        return stats;
    }

    private void addParticipants(Meeting meeting, List<String> emails) {
        for (String email : emails) {
            // Skip if already participant
            if (participantRepository.findByMeetingIdAndEmail(meeting.getId(), email).isPresent()) {
                continue;
            }
            Optional<User> pu = userRepository.findByEmail(email);
            Participant participant = Participant.builder()
                    .meeting(meeting).email(email).user(pu.orElse(null)).build();
            participantRepository.save(participant);

            // Notify if participant is in our system
            pu.ifPresent(u -> {
                saveNotification(u, meeting,
                        Notification.NotificationType.MEETING_INVITE,
                        "You have been invited to: " + meeting.getTitle() +
                        " on " + meeting.getStartTime().toLocalDate());
                try {
                    messagingTemplate.convertAndSendToUser(u.getEmail(),
                            "/queue/notifications",
                            Map.of("type", "MEETING_INVITE",
                                   "meetingId", meeting.getId(),
                                   "message", "You have been invited to: " + meeting.getTitle()));
                } catch (Exception e) {
                    log.warn("WebSocket invite notify failed: {}", e.getMessage());
                }
            });

            try { emailService.sendMeetingInvitationEmail(meeting, email); } catch (Exception e) {
                log.warn("Invitation email failed for {}: {}", email, e.getMessage());
            }
        }
    }

    private void saveNotification(User user, Meeting meeting,
                                   Notification.NotificationType type, String message) {
        try {
            Notification n = Notification.builder()
                    .user(user).meeting(meeting).type(type).message(message).build();
            notificationRepository.save(n);
        } catch (Exception e) {
            log.warn("Notification save failed: {}", e.getMessage());
        }
    }

    private void createRecurringMeetings(Meeting parent, LocalDate endDate) {
        LocalDateTime cur = parent.getStartTime();
        LocalDateTime curEnd = parent.getEndTime();
        int count = 0;
        while (count < 365) {
            cur = next(cur, parent.getRecurrencePattern());
            curEnd = next(curEnd, parent.getRecurrencePattern());
            if (cur.toLocalDate().isAfter(endDate)) break;
            Meeting r = Meeting.builder()
                    .title(parent.getTitle()).description(parent.getDescription())
                    .startTime(cur).endTime(curEnd).location(parent.getLocation())
                    .meetingType(parent.getMeetingType()).meetingLink(parent.getMeetingLink())
                    .organizer(parent.getOrganizer()).isRecurring(true)
                    .recurrencePattern(parent.getRecurrencePattern())
                    .recurrenceEndDate(endDate).parentMeeting(parent).build();
            meetingRepository.save(r);
            count++;
        }
    }

    private LocalDateTime next(LocalDateTime dt, Meeting.RecurrencePattern p) {
        return switch (p) {
            case DAILY -> dt.plusDays(1);
            case WEEKLY -> dt.plusWeeks(1);
            case MONTHLY -> dt.plusMonths(1);
            case YEARLY -> dt.plusYears(1);
        };
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + email));
    }
}
