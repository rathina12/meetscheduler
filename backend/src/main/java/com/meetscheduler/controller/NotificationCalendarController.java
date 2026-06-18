package com.meetscheduler.controller;

import com.meetscheduler.entity.Notification;
import com.meetscheduler.service.CalendarSyncService;
import com.meetscheduler.service.NotificationService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/notifications")
@Tag(name = "Notifications")
@SecurityRequirement(name = "bearerAuth")
class NotificationController {

    private final NotificationService notificationService;

    NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getNotifications(@AuthenticationPrincipal UserDetails user) {
        List<Notification> list = notificationService.getUserNotifications(user.getUsername());
        long unread = notificationService.getUnreadCount(user.getUsername());
        List<Map<String, Object>> data = list.stream().map(n -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", n.getId());
            m.put("type", n.getType() != null ? n.getType().name() : null);
            m.put("message", n.getMessage());
            m.put("readStatus", n.getReadStatus());
            m.put("createdAt", n.getCreatedAt() != null ? n.getCreatedAt().toString() : null);
            try {
                m.put("meetingId", n.getMeeting() != null ? n.getMeeting().getId() : null);
                m.put("meetingTitle", n.getMeeting() != null ? n.getMeeting().getTitle() : null);
            } catch (Exception e) {
                m.put("meetingId", null);
                m.put("meetingTitle", null);
            }
            return m;
        }).toList();
        return ResponseEntity.ok(Map.of("success", true, "data", data, "unreadCount", unread));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Map<String, Object>> markAsRead(@PathVariable Long id,
                                                           @AuthenticationPrincipal UserDetails user) {
        notificationService.markAsRead(id, user.getUsername());
        return ResponseEntity.ok(Map.of("success", true, "message", "Notification marked as read"));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Map<String, Object>> markAllAsRead(@AuthenticationPrincipal UserDetails user) {
        notificationService.markAllAsRead(user.getUsername());
        return ResponseEntity.ok(Map.of("success", true, "message", "All notifications marked as read"));
    }
}

@RestController
@RequestMapping("/api/calendar")
@Tag(name = "Calendar Sync")
@SecurityRequirement(name = "bearerAuth")
class CalendarController {

    private final CalendarSyncService calendarSyncService;

    CalendarController(CalendarSyncService calendarSyncService) {
        this.calendarSyncService = calendarSyncService;
    }

    @GetMapping("/google/auth-url")
    public ResponseEntity<Map<String, Object>> getGoogleAuthUrl() {
        return ResponseEntity.ok(Map.of("success", true, "authUrl", calendarSyncService.getGoogleAuthUrl()));
    }

    @PostMapping("/google/connect")
    public ResponseEntity<Map<String, Object>> connectGoogle(@RequestBody Map<String, String> body,
                                                              @AuthenticationPrincipal UserDetails user) {
        var ci = calendarSyncService.connectGoogle(user.getUsername(), body.get("code"));
        return ResponseEntity.ok(Map.of("success", true, "message", "Google Calendar connected",
                "data", Map.of("provider", "GOOGLE", "syncStatus", ci.getSyncStatus().name())));
    }

    @PostMapping("/sync")
    public ResponseEntity<Map<String, Object>> sync(@AuthenticationPrincipal UserDetails user) {
        var result = calendarSyncService.syncCalendar(user.getUsername());
        return ResponseEntity.ok(Map.of("success", true, "message", "Sync completed", "data", result));
    }

    @GetMapping("/integrations")
    public ResponseEntity<Map<String, Object>> getIntegrations(@AuthenticationPrincipal UserDetails user) {
        var list = calendarSyncService.getUserIntegrations(user.getUsername());
        List<Map<String, Object>> data = list.stream().map(i -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", i.getId());
            m.put("provider", i.getProvider() != null ? i.getProvider().name() : null);
            m.put("syncStatus", i.getSyncStatus() != null ? i.getSyncStatus().name() : null);
            m.put("lastSyncedAt", i.getLastSyncedAt() != null ? i.getLastSyncedAt().toString() : null);
            return m;
        }).toList();
        return ResponseEntity.ok(Map.of("success", true, "data", data));
    }

    @DeleteMapping("/google/disconnect")
    public ResponseEntity<Map<String, Object>> disconnect(@AuthenticationPrincipal UserDetails user) {
        calendarSyncService.disconnectProvider(user.getUsername(), "GOOGLE");
        return ResponseEntity.ok(Map.of("success", true, "message", "Google Calendar disconnected"));
    }
}
