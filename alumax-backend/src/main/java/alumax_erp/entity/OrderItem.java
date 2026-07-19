package alumax_erp.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Entity
@Table(name = "order_item")
@Getter
@Setter
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnoreProperties("items")
    @JoinColumn(name = "work_order_id", nullable = false)
    private WorkOrder workOrder;

    @Enumerated(EnumType.STRING)
    @Column(name = "job_type", nullable = false)
    private OrderType type = OrderType.NEW_ORDER;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_template_id")
    private ProductTemplate productTemplate;

    @Column(name = "width_w")
    private Double widthW;

    @Column(name = "height_h")
    private Double heightH;

    @Column(name = "quantity", nullable = false)
    private Integer quantity = 1;

    @Column(name = "opening_direction")
    private String openingDirection;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status = OrderStatus.NEW;

    @ElementCollection
    @CollectionTable(name = "order_item_completed_services", joinColumns = @JoinColumn(name = "order_item_id"))
    @Column(name = "service_name")
    private List<String> completedServices;

    @Column(name = "worker_note", columnDefinition = "TEXT")
    private String workerNote;

    @Column(name = "is_urgent", nullable = false)
    private boolean urgent = false;
}