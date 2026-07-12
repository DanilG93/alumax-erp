package alumax_erp.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "work_order")
@Getter
@Setter
public class WorkOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "protocol_number", unique = true)
    private String protocolNumber;

    @Column(name = "customer_description")
    private String customerDescription;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status = OrderStatus.NEW; // Ukupni status naloga (računa se na osnovu stavki)

    @Enumerated(EnumType.STRING)
    @Column(name = "order_type", nullable = false)
    private OrderType type = OrderType.NEW_ORDER;

    @Column(name = "delivery_required", nullable = false)
    private boolean deliveryRequired = false;

    @Column(name = "delivery_address")
    private String deliveryAddress;

    @OneToMany(mappedBy = "workOrder", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<OrderItem> items;

    @ElementCollection(targetClass = ServicePart.class)
    @CollectionTable(name = "work_order_service_parts", joinColumns = @JoinColumn(name = "work_order_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "service_part")
    private List<ServicePart> serviceParts;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}