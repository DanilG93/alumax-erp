package alumax_erp.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "cutting_item")
@Getter
@Setter
public class CuttingItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "work_order_id", nullable = false)
    private WorkOrder workOrder;

    @Column(name = "element_name", nullable = false, length = 100)
    private String elementName;

    @Column(name = "measure_mm", nullable = false, precision = 8, scale = 1)
    private BigDecimal measureMm;

    @Column(nullable = false)
    private Integer quantity;
}
