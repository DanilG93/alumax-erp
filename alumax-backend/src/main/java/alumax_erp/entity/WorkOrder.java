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

    @Column(name = "customer_description")
    private String customerDescription;

    @Column(name = "input_width", nullable = false, precision = 8, scale = 2)
    private BigDecimal inputWidth;

    @Column(name = "input_height", nullable = false, precision = 8, scale = 2)
    private BigDecimal inputHeight;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status = OrderStatus.NEW;

    // NOVO: Da li je nova narudžbina ili servis (po default-u stavljamo da je novo)
    @Enumerated(EnumType.STRING)
    @Column(name = "order_type", nullable = false)
    private OrderType type = OrderType.NEW_ORDER;

    // NOVO: Lista zamenjenih delova (Hibernate sam pravi veznu tabelu 'work_order_service_parts')
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