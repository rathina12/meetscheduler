package com.meetscheduler.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "participants")
public class Participant {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meeting_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "participants", "organizer", "parentMeeting"})
    private Meeting meeting;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password"})
    private User user;

    @Column(nullable = false)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(name = "response_status")
    private ResponseStatus responseStatus = ResponseStatus.PENDING;

    @CreationTimestamp
    @Column(name = "invited_at")
    private LocalDateTime invitedAt;

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;

    public enum ResponseStatus { PENDING, ACCEPTED, DECLINED, TENTATIVE }

    public Participant() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Meeting getMeeting() { return meeting; }
    public void setMeeting(Meeting meeting) { this.meeting = meeting; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public ResponseStatus getResponseStatus() { return responseStatus; }
    public void setResponseStatus(ResponseStatus responseStatus) { this.responseStatus = responseStatus; }
    public LocalDateTime getInvitedAt() { return invitedAt; }
    public LocalDateTime getRespondedAt() { return respondedAt; }
    public void setRespondedAt(LocalDateTime respondedAt) { this.respondedAt = respondedAt; }

    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private final Participant p = new Participant();
        public Builder meeting(Meeting v) { p.meeting = v; return this; }
        public Builder user(User v) { p.user = v; return this; }
        public Builder email(String v) { p.email = v; return this; }
        public Builder responseStatus(ResponseStatus v) { p.responseStatus = v; return this; }
        public Participant build() { return p; }
    }
}
