package alumax_erp.service;

import alumax_erp.entity.OrderItem;
import alumax_erp.entity.OrderStatus;
import alumax_erp.entity.WorkOrder;
import alumax_erp.repository.OrderItemRepository;
import alumax_erp.repository.WorkOrderRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class WorkOrderService {

    private final WorkOrderRepository workOrderRepository;
    private final OrderItemRepository orderItemRepository;

    public WorkOrderService(WorkOrderRepository workOrderRepository, OrderItemRepository orderItemRepository) {
        this.workOrderRepository = workOrderRepository;
        this.orderItemRepository = orderItemRepository;
    }

    public List<WorkOrder> getAllWorkOrders() {
        return workOrderRepository.findAll();
    }

    public List<String> getCustomerSuggestions() {
        return workOrderRepository.findDistinctCustomerNames();
    }

    public WorkOrder saveWorkOrder(WorkOrder workOrder) {
        workOrder.setStatus(OrderStatus.NEW);

        if (workOrder.getProtocolNumber() == null || workOrder.getProtocolNumber().trim().isEmpty()) {
            String maxProtocol = workOrderRepository.findMaxNumericProtocolNumber();
            if (maxProtocol == null) {
                workOrder.setProtocolNumber("1");
            } else {
                try {
                    long nextNum = Long.parseLong(maxProtocol) + 1;
                    workOrder.setProtocolNumber(String.valueOf(nextNum));
                } catch (NumberFormatException e) {
                    workOrder.setProtocolNumber(String.valueOf(System.currentTimeMillis() / 1000));
                }
            }
        }

        if (workOrder.getItems() != null) {
            for (OrderItem item : workOrder.getItems()) {
                item.setWorkOrder(workOrder);
                item.setStatus(OrderStatus.NEW);

                if (workOrder.isUrgent()) {
                    item.setUrgent(true);
                }
            }
        }

        return workOrderRepository.save(workOrder);
    }

    public List<OrderItem> getAllOrderItems() {
        return orderItemRepository.findAll();
    }

    public List<OrderItem> getOrderItemsByStatus(OrderStatus status) {
        return orderItemRepository.findByStatus(status);
    }

    public OrderItem updateOrderItemStatus(Long itemId, OrderStatus newStatus) {
        OrderItem item = orderItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Stavka sa ID " + itemId + " nije pronađena!"));

        item.setStatus(newStatus);
        OrderItem savedItem = orderItemRepository.save(item);

        updateParentWorkOrderStatus(savedItem.getWorkOrder());

        return savedItem;
    }

    private void updateParentWorkOrderStatus(WorkOrder workOrder) {
        boolean allCompleted = true;
        for (OrderItem i : workOrder.getItems()) {
            if (i.getStatus() != OrderStatus.COMPLETED) {
                allCompleted = false;
                break;
            }
        }

        if (allCompleted && !workOrder.getItems().isEmpty()) {
            workOrder.setStatus(OrderStatus.COMPLETED);
            workOrderRepository.save(workOrder);
        }
    }
}