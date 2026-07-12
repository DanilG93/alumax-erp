package alumax_erp.repository;

import alumax_erp.entity.OrderItem;
import alumax_erp.entity.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    List<OrderItem> findByStatus(OrderStatus status);
}
