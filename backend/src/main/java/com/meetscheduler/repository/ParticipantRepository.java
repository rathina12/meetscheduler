package com.meetscheduler.repository;
import com.meetscheduler.entity.Participant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ParticipantRepository extends JpaRepository<Participant, Long> {

    @Query("SELECT p FROM Participant p WHERE p.meeting.id = :meetingId")
    List<Participant> findByMeetingId(@Param("meetingId") Long meetingId);

    @Query("SELECT p FROM Participant p WHERE p.meeting.id = :meetingId AND p.email = :email")
    Optional<Participant> findByMeetingIdAndEmail(@Param("meetingId") Long meetingId,
                                                   @Param("email") String email);

    @Query("SELECT p FROM Participant p WHERE p.user.id = :userId AND p.responseStatus = :status")
    List<Participant> findByUserIdAndResponseStatus(@Param("userId") Long userId,
                                                    @Param("status") Participant.ResponseStatus status);

    @Query("SELECT COUNT(p) FROM Participant p WHERE p.user.id = :userId AND p.responseStatus = :status")
    long countByUserIdAndResponseStatus(@Param("userId") Long userId,
                                        @Param("status") Participant.ResponseStatus status);
}
