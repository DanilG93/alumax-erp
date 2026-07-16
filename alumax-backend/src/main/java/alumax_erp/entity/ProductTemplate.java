package alumax_erp.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "product_template")
@Getter
@Setter
public class ProductTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @OneToMany(mappedBy = "productTemplate", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CuttingRule> cuttingRules;

    @ElementCollection
    @CollectionTable(name = "template_notes", joinColumns = @JoinColumn(name = "template_id"))
    @Column(name = "note")
    private List<String> notes = new ArrayList<>();
}
