package com.meetscheduler.repository;
import com.meetscheduler.entity.Meeting;
import com.meetscheduler.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MeetingRepository extends JpaRepository<Meeting, Long> {

    @Query("SELECT DISTINCT m FROM Meeting m LEFT JOIN m.participants p " +
           "WHERE m.organizer = :user OR p.user = :user ORDER BY m.startTime ASC")
    List<Meeting> findAllMeetingsForUser(@Param("user") User user);

    @Query("SELECT DISTINCT m FROM Meeting m LEFT JOIN m.participants p " +
           "WHERE (m.organizer = :user OR p.user = :user) " +
           "AND m.startTime >= :start AND m.startTime < :end " +
           "AND m.status != 'CANCELLED' ORDER BY m.startTime ASC")
    List<Meeting> findMeetingsForUserBetween(@Param("user") User user,
                                              @Param("start") LocalDateTime start,
                                              @Param("end") LocalDateTime end);

    @Query("SELECT DISTINCT m FROM Meeting m LEFT JOIN m.participants p " +
           "WHERE (m.organizer = :user OR p.user = :user) " +
           "AND m.startTime > :now AND m.status IN ('SCHEDULED', 'RESCHEDULED') ORDER BY m.startTime ASC")
    List<Meeting> findUpcomingMeetings(@Param("user") User user, @Param("now") LocalDateTime now);

    @Query("SELECT COUNT(DISTINCT m) FROM Meeting m LEFT JOIN m.participants p " +
           "WHERE (m.organizer = :user OR p.user = :user)")
    long countMeetingsForUser(@Param("user") User user);

    @Query("SELECT DISTINCT m FROM Meeting m LEFT JOIN m.participants p " +
           "WHERE (m.organizer.id = :userId OR p.user.id = :userId) " +
           "AND m.status != 'CANCELLED' " +
           "AND (m.startTime < :endTime AND m.endTime > :startTime)")
    List<Meeting> findConflictingMeetings(@Param("userId") Long userId,
                                           @Param("startTime") LocalDateTime startTime,
                                           @Param("endTime") LocalDateTime endTime);
}
