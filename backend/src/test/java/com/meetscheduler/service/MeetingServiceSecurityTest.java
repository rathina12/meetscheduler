package com.meetscheduler.service;

import com.meetscheduler.entity.Meeting;
import com.meetscheduler.entity.Participant;
import com.meetscheduler.entity.User;
import com.meetscheduler.repository.MeetingRepository;
import com.meetscheduler.repository.UserRepository;
import com.meetscheduler.repository.ParticipantRepository;
import com.meetscheduler.repository.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

@ExtendWith(MockitoExtension.class)
class MeetingServiceSecurityTest {
    @Mock MeetingRepository meetingRepository;
    @Mock UserRepository userRepository;
    @Mock ParticipantRepository participantRepository;
    @Mock NotificationRepository notificationRepository;
    @Mock EmailService emailService;
    @Mock SimpMessagingTemplate messagingTemplate;
    @InjectMocks MeetingService service;

    private User owner;
    private User stranger;
    private Meeting meeting;

    @BeforeEach
    void setup() {
        owner = new User();
        owner.setId(1L);
        owner.setEmail("owner@example.com");
        stranger = new User();
        stranger.setId(2L);
        stranger.setEmail("stranger@example.com");
        meeting = new Meeting();
        meeting.setId(10L);
        meeting.setOrganizer(owner);
        meeting.setStartTime(LocalDateTime.of(2027, 1, 2, 10, 0));
        meeting.setEndTime(LocalDateTime.of(2027, 1, 2, 11, 0));
    }

    @Test
    void strangersCannotViewMeetingById() {
        when(userRepository.findByEmail("stranger@example.com")).thenReturn(Optional.of(stranger));
        when(meetingRepository.findById(10L)).thenReturn(Optional.of(meeting));
        when(participantRepository.findByMeetingIdAndEmail(10L, "stranger@example.com"))
                .thenReturn(Optional.empty());
        assertTrue(service.getMeetingById(10L, "stranger@example.com").isEmpty());
    }

    @Test
    void organizerCanViewMeeting() {
        when(userRepository.findByEmail("owner@example.com")).thenReturn(Optional.of(owner));
        when(meetingRepository.findById(10L)).thenReturn(Optional.of(meeting));
        assertTrue(service.getMeetingById(10L, "owner@example.com").isPresent());
    }

    @Test
    void strangersCannotCreateTheirOwnRsvp() {
        when(userRepository.findByEmail("stranger@example.com")).thenReturn(Optional.of(stranger));
        when(participantRepository.findByMeetingIdAndEmail(10L, "stranger@example.com"))
                .thenReturn(Optional.empty());
        assertThrows(AccessDeniedException.class, () ->
                service.respondToInvite(10L, "stranger@example.com", Participant.ResponseStatus.ACCEPTED));
        verify(participantRepository, never()).save(any());
    }

    @Test
    void invalidMeetingIntervalIsRejected() {
        when(userRepository.findByEmail("owner@example.com")).thenReturn(Optional.of(owner));
        LocalDateTime start = LocalDateTime.of(2027, 1, 2, 11, 0);
        assertThrows(IllegalArgumentException.class, () ->
                service.createMeeting("Invalid", "", start, start, null,
                        Meeting.MeetingType.ONLINE, null, List.of(), false,
                        null, null, "owner@example.com", false));
        verify(meetingRepository, never()).save(any());
    }

    @Test
    void editsCannotOverlapAnotherMeeting() {
        when(meetingRepository.findById(10L)).thenReturn(Optional.of(meeting));
        when(userRepository.findByEmail("owner@example.com")).thenReturn(Optional.of(owner));
        Meeting existing = new Meeting();
        existing.setId(11L);
        when(meetingRepository.findConflictingMeetings(eq(1L), any(), any()))
                .thenReturn(List.of(existing));
        assertThrows(IllegalStateException.class, () ->
                service.updateMeeting(10L, "Changed", null,
                        LocalDateTime.of(2027, 1, 2, 12, 0),
                        LocalDateTime.of(2027, 1, 2, 13, 0),
                        null, Meeting.MeetingType.ONLINE, null, "owner@example.com"));
        verify(meetingRepository, never()).save(any());
    }
}
