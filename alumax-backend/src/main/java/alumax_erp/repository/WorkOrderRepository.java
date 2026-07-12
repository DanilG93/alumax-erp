package alumax_erp.repository;

import alumax_erp.entity.WorkOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkOrderRepository extends JpaRepository<WorkOrder, Long> {

    @Query("SELECT DISTINCT w.customerDescription FROM WorkOrder w WHERE w.customerDescription IS NOT NULL AND w.customerDescription != ''")
    List<String> findDistinctCustomerDescriptions();

    @Query(value = "SELECT w.protocol_number FROM work_order w WHERE w.protocol_number REGEXP '^[0-9]+$' ORDER BY CAST(w.protocol_number AS UNSIGNED) DESC LIMIT 1", nativeQuery = true)
    String findMaxNumericProtocolNumber();
}
