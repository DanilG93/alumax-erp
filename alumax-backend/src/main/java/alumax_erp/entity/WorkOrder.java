package alumax_erp.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
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

    @Column(name = "input_width", nullable = false, precision = 8, scale = 2)
    private BigDecimal inputWidth;

    @Column(name = "input_height", nullable = false, precision = 8, scale = 2)
    private BigDecimal inputHeight;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status = OrderStatus.NEW;

    @Enumerated(EnumType.STRING)
    @Column(name = "order_type", nullable = false)
    private OrderType type = OrderType.NEW_ORDER;

    @Column(name = "delivery_required", nullable = false)
    private boolean deliveryRequired = false;

    @Column(name = "delivery_address")
    private String deliveryAddress;

    @Column(name = "plisse_type")
    private String plisseType;

    @Column(name = "is_double", nullable = false)
    private boolean isDouble = false;

    @Column(name = "no_threshold", nullable = false)
    private boolean noThreshold = false;

    @Column(name = "opening_direction")
    private String openingDirection;

    @ElementCollection(targetClass = ServicePart.class)
    @CollectionTable(name = "work_order_service_parts", joinColumns = @JoinColumn(name = "work_order_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "service_part")
    private List<ServicePart> serviceParts;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "workOrder", cascade = CascadeType.ALL)
    private List<CuttingItem> cuttingItems;
}