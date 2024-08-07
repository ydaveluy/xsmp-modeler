import { CstNode, DefaultValueConverter, GrammarAST, ValueConverter, ValueType } from "langium";


export class XsmpValueConverter extends DefaultValueConverter {
    protected override runConverter(rule: GrammarAST.AbstractRule, input: string, cstNode: CstNode): ValueType {
        if (rule.name.toUpperCase() === 'CHAR')
            return ValueConverter.convertString(input);
        return super.runConverter(rule, input, cstNode)
    }
}