package com.meetscheduler.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "meetings")
public class Meeting {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(length = 300)
    private String location;

    @Enumerated(EnumType.STRING)
    @Column(name = "meeting_type")
    private MeetingType meetingType = MeetingType.ONLINE;

    @Column(name = "meeting_link")
    private String meetingLink;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "organizer_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password"})
    private User organizer;

    @Enumerated(EnumType.STRING)
    private Status status = Status.SCHEDULED;

    @Column(name = "is_recurring")
    private Boolean isRecurring = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "recurrence_pattern")
    private RecurrencePattern recurrencePattern;

    @Column(name = "recurrence_end_date")
    private LocalDate recurrenceEndDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_meeting_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "participants", "parentMeeting", "organizer"})
    private Meeting parentMeeting;

    @OneToMany(mappedBy = "meeting", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JsonIgnoreProperties({"meeting", "hibernateLazyInitializer", "handler"})
    private List<Participant> participants = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum MeetingType { ONLINE, OFFLINE }
    public enum Status { SCHEDULED, CANCELLED, COMPLETED, RESCHEDULED }
    public enum RecurrencePattern { DAILY, WEEKLY, MONTHLY, YEARLY }

    public Meeting() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public MeetingType getMeetingType() { return meetingType; }
    public void setMeetingType(MeetingType meetingType) { this.meetingType = meetingType; }
    public String getMeetingLink() { return meetingLink; }
    public void setMeetingLink(String meetingLink) { this.meetingLink = meetingLink; }
    public User getOrganizer() { return organizer; }
    public void setOrganizer(User organizer) { this.organizer = organizer; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public Boolean getIsRecurring() { return isRecurring; }
    public void setIsRecurring(Boolean isRecurring) { this.isRecurring = isRecurring; }
    public RecurrencePattern getRecurrencePattern() { return recurrencePattern; }
    public void setRecurrencePattern(RecurrencePattern recurrencePattern) { this.recurrencePattern = recurrencePattern; }
    public LocalDate getRecurrenceEndDate() { return recurrenceEndDate; }
    public void setRecurrenceEndDate(LocalDate recurrenceEndDate) { this.recurrenceEndDate = recurrenceEndDate; }
    public Meeting getParentMeeting() { return parentMeeting; }
    public void setParentMeeting(Meeting parentMeeting) { this.parentMeeting = parentMeeting; }
    public List<Participant> getParticipants() { return participants; }
    public void setParticipants(List<Participant> participants) { this.participants = participants; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private final Meeting m = new Meeting();
        public Builder title(String v) { m.title = v; return this; }
        public Builder description(String v) { m.description = v; return this; }
        public Builder startTime(LocalDateTime v) { m.startTime = v; return this; }
        public Builder endTime(LocalDateTime v) { m.endTime = v; return this; }
        public Builder location(String v) { m.location = v; return this; }
        public Builder meetingType(MeetingType v) { m.meetingType = v; return this; }
        public Builder meetingLink(String v) { m.meetingLink = v; return this; }
        public Builder organizer(User v) { m.organizer = v; return this; }
        public Builder status(Status v) { m.status = v; return this; }
        public Builder isRecurring(Boolean v) { m.isRecurring = v; return this; }
        public Builder recurrencePattern(RecurrencePattern v) { m.recurrencePattern = v; return this; }
        public Builder recurrenceEndDate(LocalDate v) { m.recurrenceEndDate = v; return this; }
        public Builder parentMeeting(Meeting v) { m.parentMeeting = v; return this; }
        public Meeting build() { return m; }
    }
}
