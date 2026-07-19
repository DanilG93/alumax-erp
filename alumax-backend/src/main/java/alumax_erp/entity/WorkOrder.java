package alumax_erp.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
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

    @Column(name = "customer_name", nullable = false)
    private String customerName;


    @Column(name = "profile_color")
    private String profileColor;

    @Column(name = "delivery_date")
    private LocalDate deliveryDate;

    @JsonProperty("isUrgent")
    @Column(name = "is_urgent", nullable = false)
    private boolean isUrgent = false;

    @Column(name = "requires_delivery", nullable = false)
    private boolean requiresDelivery = false;

    @Column(name = "delivery_address")
    private String deliveryAddress;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status = OrderStatus.NEW;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "workOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();
}