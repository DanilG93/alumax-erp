package alumax_erp.service;

import alumax_erp.entity.OrderStatus;
import alumax_erp.entity.WorkOrder;
import alumax_erp.repository.WorkOrderRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class WorkOrderService {

    private final WorkOrderRepository repository;

    public WorkOrderService(WorkOrderRepository repository) {
        this.repository = repository;
    }

    public List<WorkOrder> getAllWorkOrders() {
        return repository.findAll();
    }

    public WorkOrder saveWorkOrder(WorkOrder workOrder) {

        workOrder.setStatus(OrderStatus.NEW);
        return repository.save(workOrder);
    }

    public WorkOrder updateOrderStatus(Long orderId, OrderStatus newStatus) {

        WorkOrder order = repository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Work order with ID " + orderId + " not found!"));

        order.setStatus(newStatus);
        return repository.save(order);
    }
}