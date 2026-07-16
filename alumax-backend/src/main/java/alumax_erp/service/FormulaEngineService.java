package alumax_erp.service;

import alumax_erp.entity.CuttingRule;
import org.mvel2.MVEL;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class FormulaEngineService {

    public static class CalculatedItem {
        public String elementName;
        public int quantity;
        public double resultValue;

        public CalculatedItem(String elementName, int quantity, double resultValue) {
            this.elementName = elementName;
            this.quantity = quantity;
            this.resultValue = resultValue;
        }
    }

    public List<CalculatedItem> calculateTemplate(List<CuttingRule> rules, double widthW, double heightH) {
        List<CalculatedItem> results = new ArrayList<>();

        Map<String, Object> variables = new HashMap<>();
        variables.put("W", widthW);
        variables.put("H", heightH);

        for (CuttingRule rule : rules) {
            double calculatedValue = 0.0;

            if ("FIXED".equals(rule.getRuleType())) {
                double baseValue = "WIDTH".equals(rule.getTargetDimension()) ? widthW : heightH;
                if ("ADD".equals(rule.getOperation())) {
                    calculatedValue = baseValue + rule.getValue();
                } else {
                    calculatedValue = baseValue - rule.getValue();
                }

            } else if ("FORMULA".equals(rule.getRuleType())) {

                try {
                    Object result = MVEL.eval(rule.getFormula(), variables);
                    calculatedValue = Double.parseDouble(result.toString());
                } catch (Exception e) {
                    System.err.println("Greška u računanju formule [" + rule.getFormula() + "] za element: " + rule.getElementName());
                    calculatedValue = 0.0;
                }
            }

            calculatedValue = Math.round(calculatedValue * 100.0) / 100.0;

            results.add(new CalculatedItem(rule.getElementName(), rule.getQuantityMultiplier(), calculatedValue));

            if (rule.getVariableName() != null && !rule.getVariableName().trim().isEmpty()) {
                variables.put(rule.getVariableName().trim(), calculatedValue);
            }
        }

        return results;
    }
}