package alumax_erp.controller;

import alumax_erp.entity.OrderItem;
import alumax_erp.entity.OrderStatus;
import alumax_erp.entity.WorkOrder;
import alumax_erp.service.WorkOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/work-orders")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class WorkOrderController {

    private final WorkOrderService service;

    @GetMapping
    public List<WorkOrder> getAllWorkOrders() {
        return service.getAllWorkOrders();
    }

    @PostMapping
    public WorkOrder createWorkOrder(@RequestBody WorkOrder workOrder) {
        return service.saveWorkOrder(workOrder);
    }

    @GetMapping("/customers/suggestions")
    public ResponseEntity<List<String>> getCustomerSuggestions() {
        return ResponseEntity.ok(service.getCustomerSuggestions());
    }

    @GetMapping("/items")
    public List<OrderItem> getAllOrderItems(@RequestParam(required = false) OrderStatus status) {
        if (status != null) {
            return service.getOrderItemsByStatus(status);
        }
        return service.getAllOrderItems();
    }

    @PutMapping("/items/{itemId}/status")
    public OrderItem updateItemStatus(@PathVariable Long itemId, @RequestParam OrderStatus status) {
        return service.updateOrderItemStatus(itemId, status);
    }
}