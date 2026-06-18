package com.meetscheduler.repository;
import com.meetscheduler.entity.CalendarIntegration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CalendarIntegrationRepository extends JpaRepository<CalendarIntegration, Long> {

    @Query("SELECT c FROM CalendarIntegration c WHERE c.user.id = :userId")
    List<CalendarIntegration> findByUserId(@Param("userId") Long userId);

    @Query("SELECT c FROM CalendarIntegration c WHERE c.user.id = :userId AND c.provider = :provider")
    Optional<CalendarIntegration> findByUserIdAndProvider(@Param("userId") Long userId,
                                                           @Param("provider") CalendarIntegration.Provider provider);
}
