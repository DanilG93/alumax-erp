package alumax_erp.controller;

import alumax_erp.entity.OrderStatus;
import alumax_erp.entity.WorkOrder;
import alumax_erp.service.WorkOrderService;
import lombok.RequiredArgsConstructor;
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

    @PutMapping("/{id}/status")
    public WorkOrder updateStatus(@PathVariable Long id, @RequestParam OrderStatus status) {
        return service.updateOrderStatus(id, status);
    }
}
