package alumax_erp.repository;

import alumax_erp.entity.WorkOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkOrderRepository extends JpaRepository<WorkOrder, Long> {

    @Query("SELECT DISTINCT w.customerName FROM WorkOrder w WHERE w.customerName IS NOT NULL AND w.customerName != ''")
    List<String> findDistinctCustomerNames();

    @Query(value = "SELECT w.protocol_number FROM work_order w WHERE w.protocol_number REGEXP '^[0-9]+$' ORDER BY CAST(w.protocol_number AS UNSIGNED) DESC LIMIT 1", nativeQuery = true)
    String findMaxNumericProtocolNumber();
}
