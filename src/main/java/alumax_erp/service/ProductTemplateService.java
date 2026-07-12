package alumax_erp.service;

import alumax_erp.entity.ProductTemplate;
import alumax_erp.repository.ProductTemplateRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductTemplateService {

    private final ProductTemplateRepository repository;

    public ProductTemplateService(ProductTemplateRepository repository) {
        this.repository = repository;
    }

    public List<ProductTemplate> getAllTemplates() {
        return repository.findAll();
    }

    public ProductTemplate saveTemplate(ProductTemplate template) {
        return repository.save(template);
    }

    public void deleteTemplate(Long id) {
        repository.deleteById(id);
    }
}