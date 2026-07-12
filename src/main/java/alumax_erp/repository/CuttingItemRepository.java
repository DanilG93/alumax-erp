package alumax_erp.repository;

import alumax_erp.entity.WorkOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CuttingItemRepository extends JpaRepository<WorkOrder, Long> {
}
