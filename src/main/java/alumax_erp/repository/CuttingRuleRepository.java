package alumax_erp.repository;

import alumax_erp.entity.ProductTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CuttingRuleRepository extends JpaRepository<ProductTemplate, Long> {
}
