package alumax_erp.service;

import alumax_erp.entity.CuttingRule;
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

        if (template.getCuttingRules() != null) {
            for (CuttingRule rule : template.getCuttingRules()) {
                rule.setProductTemplate(template);
            }
        }

        return repository.save(template);
    }

    public void deleteTemplate(Long id) {
        repository.deleteById(id);
    }

    public ProductTemplate updateTemplate(Long id, ProductTemplate updatedTemplate) {

        ProductTemplate existingTemplate = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Šablon nije pronađen!"));

        existingTemplate.setName(updatedTemplate.getName());
        existingTemplate.setNotes(updatedTemplate.getNotes());


        if (existingTemplate.getCuttingRules() != null) {
            existingTemplate.getCuttingRules().clear();
        }

        if (updatedTemplate.getCuttingRules() != null) {
            for (CuttingRule rule : updatedTemplate.getCuttingRules()) {
                rule.setProductTemplate(existingTemplate);
                existingTemplate.getCuttingRules().add(rule);
            }
        }

        return repository.save(existingTemplate);
    }
}