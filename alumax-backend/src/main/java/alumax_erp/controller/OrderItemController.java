package alumax_erp.controller;

import alumax_erp.entity.OrderItem;
import alumax_erp.repository.OrderItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/order-items")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class OrderItemController {

    private final OrderItemRepository repository;

    @PatchMapping("/{id}/toggle-urgent")
    public OrderItem toggleUrgent(@PathVariable Long id) {
        OrderItem item = repository.findById(id).orElseThrow(() -> new RuntimeException("Stavka nije pronađena"));
        item.setUrgent(!item.isUrgent());
        return repository.save(item);
    }
}