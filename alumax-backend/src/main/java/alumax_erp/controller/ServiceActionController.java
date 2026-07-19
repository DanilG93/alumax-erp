package alumax_erp.controller;

import alumax_erp.entity.ServiceAction;
import alumax_erp.repository.ServiceActionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/service-actions")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ServiceActionController {

    private final ServiceActionRepository repository;

    @GetMapping
    public List<ServiceAction> getAll() {
        return repository.findAll();
    }

    @PostMapping
    public ServiceAction create(@RequestBody ServiceAction action) {
        return repository.save(action);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        repository.deleteById(id);
    }
}