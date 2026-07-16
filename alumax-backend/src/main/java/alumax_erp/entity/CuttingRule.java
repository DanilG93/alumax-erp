package alumax_erp.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "cutting_rule")
@Getter
@Setter
public class CuttingRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "template_id", nullable = false)
    @JsonIgnore
    private ProductTemplate productTemplate;

    @Column(name = "element_name", nullable = false, length = 100)
    private String elementName;

    @Column(name = "quantity_multiplier", nullable = false)
    private Integer quantityMultiplier;

    @Column(name = "rule_type")
    private String ruleType;

    @Column(name = "formula")
    private String formula;

    @Column(name = "target_dimension")
    private String targetDimension;

    @Column(name = "operation")
    private String operation;

    @Column(name = "value")
    private Double value;

    @Column(name = "variable_name", length = 10)
    private String variableName;
}