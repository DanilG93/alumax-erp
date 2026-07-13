package alumax_erp.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;

@Entity
@Table(name = "order_item")
@Getter
@Setter
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JsonIgnoreProperties("items")
    @JoinColumn(name = "work_order_id", nullable = false)
    private WorkOrder workOrder;

    @Column(name = "input_width", nullable = false, precision = 8, scale = 2)
    private BigDecimal inputWidth;

    @Column(name = "input_height", nullable = false, precision = 8, scale = 2)
    private BigDecimal inputHeight;

    @Column(name = "plisse_type")
    private String plisseType;

    @Column(name = "is_double", nullable = false)
    private boolean isDouble = false;

    @Column(name = "has_threshold", nullable = false)
    private boolean hasThreshold = false;

    @Column(name = "opening_direction")
    private String openingDirection;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status = OrderStatus.NEW;
}