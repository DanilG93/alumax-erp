package alumax_erp.controller;

import alumax_erp.entity.ProductTemplate;
import alumax_erp.service.ProductTemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/templates")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ProductTemplateController {

    private final ProductTemplateService service;

    @GetMapping
    public List<ProductTemplate> getAllTemplates() {
        return service.getAllTemplates();
    }

    @PostMapping
    public ProductTemplate createTemplate(@RequestBody ProductTemplate productTemplate) {
        return service.saveTemplate(productTemplate);
    }

    @DeleteMapping("/{id}")
    public void deleteTemplate(@PathVariable Long id) {
        service.deleteTemplate(id);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductTemplate> updateTemplate(@PathVariable Long id, @RequestBody ProductTemplate templateDetails) {
        ProductTemplate updatedTemplate = service.updateTemplate(id, templateDetails);
        return ResponseEntity.ok(updatedTemplate);
    }

}
