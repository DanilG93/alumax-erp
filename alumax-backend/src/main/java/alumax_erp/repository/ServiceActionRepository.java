package alumax_erp.repository;

import alumax_erp.entity.ServiceAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ServiceActionRepository extends JpaRepository<ServiceAction, Long> {
}