package alumax_erp.entity;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "cutting_rule")
@Getter
@Setter
public class CuttingRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "template_id",nullable = false)
    private ProductTemplate productTemplate;

    @Column(name = "element_name",nullable = false,length = 100)
    private String elementName;

    @Column(name = "deduct_mm", nullable = false,precision = 6, scale = 1)
    private BigDecimal deductMm;

    @Column(name = "quantity_multiplier", nullable = false)
    private Integer quantityMultiplier;

}
