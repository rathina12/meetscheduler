package com.meetscheduler.service;

import com.meetscheduler.entity.Meeting;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;
import java.time.format.DateTimeFormatter;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("MMM dd, yyyy hh:mm a");

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromEmail;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Async
    public void sendMeetingInvitationEmail(Meeting meeting, String toEmail) {
        try {
            String body = baseTemplate("<h2 style='color:#4f46e5;'>You're Invited!</h2>" +
                "<p><strong>Meeting:</strong> " + meeting.getTitle() + "</p>" +
                "<p><strong>Start:</strong> " + meeting.getStartTime().format(FMT) + "</p>" +
                "<p><strong>End:</strong> " + meeting.getEndTime().format(FMT) + "</p>" +
                "<p><strong>Organizer:</strong> " + meeting.getOrganizer().getName() + "</p>");
            sendHtml(toEmail, "Meeting Invitation: " + meeting.getTitle(), body);
        } catch (Exception e) {
            log.warn("Failed to send invitation email to {}: {}", toEmail, e.getMessage());
        }
    }

    @Async
    public void sendMeetingUpdateEmail(Meeting meeting) {
        if (meeting.getParticipants() == null) return;
        meeting.getParticipants().forEach(p -> {
            try {
                String body = baseTemplate("<h2 style='color:#0891b2;'>Meeting Updated</h2>" +
                    "<p><strong>Meeting:</strong> " + meeting.getTitle() + "</p>" +
                    "<p><strong>New Start:</strong> " + meeting.getStartTime().format(FMT) + "</p>");
                sendHtml(p.getEmail(), "Meeting Updated: " + meeting.getTitle(), body);
            } catch (Exception e) {
                log.warn("Failed to send update email: {}", e.getMessage());
            }
        });
    }

    @Async
    public void sendMeetingCancellationEmail(Meeting meeting) {
        if (meeting.getParticipants() == null) return;
        meeting.getParticipants().forEach(p -> {
            try {
                String body = baseTemplate("<h2 style='color:#dc2626;'>Meeting Cancelled</h2>" +
                    "<p><strong>Meeting:</strong> " + meeting.getTitle() + "</p>" +
                    "<p><strong>Was scheduled for:</strong> " + meeting.getStartTime().format(FMT) + "</p>");
                sendHtml(p.getEmail(), "Meeting Cancelled: " + meeting.getTitle(), body);
            } catch (Exception e) {
                log.warn("Failed to send cancellation email: {}", e.getMessage());
            }
        });
    }

    @Async
    public void sendMeetingReminderEmail(Meeting meeting, String toEmail) {
        try {
            String link = meeting.getMeetingLink() != null
                    ? "<a href='" + meeting.getMeetingLink() + "'>Join Meeting</a>" : "";
            String body = baseTemplate("<h2 style='color:#d97706;'>Reminder: Meeting starts soon!</h2>" +
                "<p><strong>Meeting:</strong> " + meeting.getTitle() + "</p>" +
                "<p><strong>Start:</strong> " + meeting.getStartTime().format(FMT) + "</p>" + link);
            sendHtml(toEmail, "Reminder: " + meeting.getTitle(), body);
        } catch (Exception e) {
            log.warn("Failed to send reminder email to {}: {}", toEmail, e.getMessage());
        }
    }

    private void sendHtml(String to, String subject, String html) throws Exception {
        MimeMessage msg = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
        helper.setFrom(fromEmail);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(html, true);
        mailSender.send(msg);
        log.debug("Email sent to: {}", to);
    }

    private String baseTemplate(String content) {
        return "<!DOCTYPE html><html><body style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;'>" +
               "<div style='background:#4f46e5;padding:20px;border-radius:8px 8px 0 0;'>" +
               "<h1 style='color:white;margin:0;'>MeetScheduler</h1></div>" +
               "<div style='background:#f8fafc;padding:30px;border:1px solid #e2e8f0;border-radius:0 0 8px 8px;'>" +
               content + "<hr style='border:none;border-top:1px solid #e2e8f0;margin:20px 0;'>" +
               "<p style='color:#64748b;font-size:12px;'>MeetScheduler automated notification.</p>" +
               "</div></body></html>";
    }
}
