package com.meetscheduler.controller;

import com.meetscheduler.entity.Meeting;
import com.meetscheduler.entity.Participant;
import com.meetscheduler.service.MeetingService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/meetings")
@Tag(name = "Meetings")
@SecurityRequirement(name = "bearerAuth")
public class MeetingController {

    private final MeetingService meetingService;

    public MeetingController(MeetingService meetingService) {
        this.meetingService = meetingService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getMyMeetings(@AuthenticationPrincipal UserDetails user) {
        return ok(meetingService.getUserMeetings(user.getUsername())
                .stream().map(this::toMap).toList(), "Meetings retrieved");
    }

    @GetMapping("/today")
    public ResponseEntity<Map<String, Object>> getTodayMeetings(@AuthenticationPrincipal UserDetails user) {
        return ok(meetingService.getTodayMeetings(user.getUsername())
                .stream().map(this::toMap).toList(), "Today meetings retrieved");
    }

    @GetMapping("/upcoming")
    public ResponseEntity<Map<String, Object>> getUpcomingMeetings(@AuthenticationPrincipal UserDetails user) {
        return ok(meetingService.getUpcomingMeetings(user.getUsername())
                .stream().map(this::toMap).toList(), "Upcoming meetings retrieved");
    }

    @GetMapping("/range")
    public ResponseEntity<Map<String, Object>> getMeetingsByRange(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return ok(meetingService.getMeetingsByDateRange(user.getUsername(), start, end)
                .stream().map(this::toMap).toList(), "Meetings retrieved");
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard(@AuthenticationPrincipal UserDetails user) {
        return ok(meetingService.getDashboardStats(user.getUsername()), "Dashboard retrieved");
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getMeeting(@PathVariable Long id,
                                                           @AuthenticationPrincipal UserDetails user) {
        Meeting m = meetingService.getMeetingById(id, user.getUsername())
                .orElseThrow(() -> new NoSuchElementException("Meeting not found"));
        return ok(toMap(m), "Meeting retrieved");
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createMeeting(
            @Valid @RequestBody MeetingRequest req,
            @RequestParam(defaultValue = "false") boolean forceCreate,
            @AuthenticationPrincipal UserDetails user) {
        try {
            Meeting m = meetingService.createMeeting(
                    req.getTitle(), req.getDescription(), req.getStartTime(), req.getEndTime(),
                    req.getLocation(), req.getMeetingType(), req.getMeetingLink(),
                    req.getParticipantEmails(), req.getIsRecurring(), req.getRecurrencePattern(),
                    req.getRecurrenceEndDate(), user.getUsername(), forceCreate);
            return ok(toMap(m), "Meeting created successfully");
        } catch (IllegalStateException e) {
            String msg = e.getMessage();
            if (msg != null && msg.startsWith("TIME_CONFLICT:")) {
                // Return 409 with conflict info but allow frontend to offer override
                String conflictWith = msg.substring("TIME_CONFLICT:".length());
                Map<String, Object> resp = new LinkedHashMap<>();
                resp.put("success", false);
                resp.put("conflict", true);
                resp.put("message", "Time conflict with: " + conflictWith);
                resp.put("tip", "Pass ?forceCreate=true to create anyway");
                return ResponseEntity.status(409).body(resp);
            }
            throw e;
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateMeeting(
            @PathVariable Long id,
            @RequestBody MeetingRequest req,
            @AuthenticationPrincipal UserDetails user) {
        Meeting m = meetingService.updateMeeting(id, req.getTitle(), req.getDescription(),
                req.getStartTime(), req.getEndTime(), req.getLocation(),
                req.getMeetingType(), req.getMeetingLink(), user.getUsername());
        return ok(toMap(m), "Meeting updated successfully");
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<Map<String, Object>> cancelMeeting(@PathVariable Long id,
                                                              @AuthenticationPrincipal UserDetails user) {
        meetingService.cancelMeeting(id, user.getUsername());
        return ok(null, "Meeting cancelled");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteMeeting(@PathVariable Long id,
                                                              @AuthenticationPrincipal UserDetails user) {
        meetingService.deleteMeeting(id, user.getUsername());
        return ok(null, "Meeting deleted successfully");
    }

    @PostMapping("/respond")
    public ResponseEntity<Map<String, Object>> respondToInvite(
            @RequestBody RespondRequest req,
            @AuthenticationPrincipal UserDetails user) {
        Participant p = meetingService.respondToInvite(
                req.getMeetingId(), user.getUsername(), req.getStatus());
        return ok(toParticipantMap(p), "Response recorded");
    }

    // --- Safe manual serialization ---
    private Map<String, Object> toMap(Meeting m) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", m.getId());
        map.put("title", m.getTitle());
        map.put("description", m.getDescription());
        map.put("startTime", m.getStartTime() != null ? m.getStartTime().toString() : null);
        map.put("endTime", m.getEndTime() != null ? m.getEndTime().toString() : null);
        map.put("location", m.getLocation());
        map.put("meetingType", m.getMeetingType() != null ? m.getMeetingType().name() : null);
        map.put("meetingLink", m.getMeetingLink());
        map.put("status", m.getStatus() != null ? m.getStatus().name() : null);
        map.put("isRecurring", m.getIsRecurring());
        map.put("recurrencePattern", m.getRecurrencePattern() != null ? m.getRecurrencePattern().name() : null);
        map.put("recurrenceEndDate", m.getRecurrenceEndDate() != null ? m.getRecurrenceEndDate().toString() : null);
        map.put("createdAt", m.getCreatedAt() != null ? m.getCreatedAt().toString() : null);
        if (m.getOrganizer() != null) {
            map.put("organizer", Map.of(
                "id", m.getOrganizer().getId(),
                "name", m.getOrganizer().getName(),
                "email", m.getOrganizer().getEmail(),
                "avatarUrl", m.getOrganizer().getAvatarUrl() != null ? m.getOrganizer().getAvatarUrl() : ""
            ));
        }
        List<Map<String, Object>> parts = new ArrayList<>();
        if (m.getParticipants() != null) {
            for (Participant p : m.getParticipants()) {
                parts.add(toParticipantMap(p));
            }
        }
        map.put("participants", parts);
        return map;
    }

    private Map<String, Object> toParticipantMap(Participant p) {
        Map<String, Object> pm = new LinkedHashMap<>();
        pm.put("id", p.getId());
        pm.put("email", p.getEmail());
        pm.put("name", p.getUser() != null ? p.getUser().getName() : p.getEmail());
        pm.put("responseStatus", p.getResponseStatus() != null ? p.getResponseStatus().name() : "PENDING");
        pm.put("invitedAt", p.getInvitedAt() != null ? p.getInvitedAt().toString() : null);
        pm.put("respondedAt", p.getRespondedAt() != null ? p.getRespondedAt().toString() : null);
        return pm;
    }

    private ResponseEntity<Map<String, Object>> ok(Object data, String message) {
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("success", true);
        resp.put("message", message);
        resp.put("data", data != null ? data : Map.of());
        return ResponseEntity.ok(resp);
    }

    // --- DTOs ---
    public static class MeetingRequest {
        @NotBlank private String title;
        private String description;
        @NotNull private LocalDateTime startTime;
        @NotNull private LocalDateTime endTime;
        private String location;
        private Meeting.MeetingType meetingType;
        private String meetingLink;
        private List<String> participantEmails;
        private Boolean isRecurring;
        private Meeting.RecurrencePattern recurrencePattern;
        private LocalDate recurrenceEndDate;
        public String getTitle() { return title; }
        public void setTitle(String v) { this.title = v; }
        public String getDescription() { return description; }
        public void setDescription(String v) { this.description = v; }
        public LocalDateTime getStartTime() { return startTime; }
        public void setStartTime(LocalDateTime v) { this.startTime = v; }
        public LocalDateTime getEndTime() { return endTime; }
        public void setEndTime(LocalDateTime v) { this.endTime = v; }
        public String getLocation() { return location; }
        public void setLocation(String v) { this.location = v; }
        public Meeting.MeetingType getMeetingType() { return meetingType; }
        public void setMeetingType(Meeting.MeetingType v) { this.meetingType = v; }
        public String getMeetingLink() { return meetingLink; }
        public void setMeetingLink(String v) { this.meetingLink = v; }
        public List<String> getParticipantEmails() { return participantEmails; }
        public void setParticipantEmails(List<String> v) { this.participantEmails = v; }
        public Boolean getIsRecurring() { return isRecurring; }
        public void setIsRecurring(Boolean v) { this.isRecurring = v; }
        public Meeting.RecurrencePattern getRecurrencePattern() { return recurrencePattern; }
        public void setRecurrencePattern(Meeting.RecurrencePattern v) { this.recurrencePattern = v; }
        public LocalDate getRecurrenceEndDate() { return recurrenceEndDate; }
        public void setRecurrenceEndDate(LocalDate v) { this.recurrenceEndDate = v; }
    }

    public static class RespondRequest {
        @NotNull private Long meetingId;
        @NotNull private Participant.ResponseStatus status;
        public Long getMeetingId() { return meetingId; }
        public void setMeetingId(Long v) { this.meetingId = v; }
        public Participant.ResponseStatus getStatus() { return status; }
        public void setStatus(Participant.ResponseStatus v) { this.status = v; }
    }
}
