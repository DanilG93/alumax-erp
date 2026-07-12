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

    public List<String> getCustomerSuggestions() {
        return repository.findDistinctCustomerDescriptions();
    }

    public WorkOrder saveWorkOrder(WorkOrder workOrder) {
        workOrder.setStatus(OrderStatus.NEW);

        // Pametna logika za Protokol broj (Ručni unos + Auto-increment)
        if (workOrder.getProtocolNumber() == null || workOrder.getProtocolNumber().trim().isEmpty()) {
            String maxProtocol = repository.findMaxNumericProtocolNumber();
            if (maxProtocol == null) {
                workOrder.setProtocolNumber("1"); // Ako je baza skroz prazna, krećemo od 1
            } else {
                try {
                    long nextNum = Long.parseLong(maxProtocol) + 1;
                    workOrder.setProtocolNumber(String.valueOf(nextNum));
                } catch (NumberFormatException e) {
                    workOrder.setProtocolNumber(String.valueOf(System.currentTimeMillis() / 1000)); // Rezervni plan
                }
            }
        }

        return repository.save(workOrder);
    }

    public WorkOrder updateOrderStatus(Long orderId, OrderStatus newStatus) {
        WorkOrder order = repository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Work order with ID " + orderId + " not found!"));

        order.setStatus(newStatus);
        return repository.save(order);
    }
}