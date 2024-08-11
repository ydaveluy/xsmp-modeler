import { CstNode, DefaultValueConverter, GrammarAST, ValueType } from "langium";


export class XsmpValueConverter extends DefaultValueConverter {
    protected override runConverter(rule: GrammarAST.AbstractRule, input: string, cstNode: CstNode): ValueType {

        switch (rule.name) {
            case 'STRING':
            case 'CHAR':
                return this.convertString(input)
            default:
                return super.runConverter(rule, input, cstNode)
        }
    }
    convertString(s: string): string {
        const escapeMap: { [key: string]: string } = {
            'a': '\x07',
            'b': '\x08',
            'f': '\x0c',
            'n': '\n',
            'r': '\r',
            't': '\t',
            'v': '\x0b',
            '\\': '\\',
            '"': '"',
            '\'': '\'',
            '?': '\x3f'
        };

        let result = '';
        let i = 1;

        while (i < s.length-1) {
            let ch = s[i++];

            if (ch === '\\') {
                ch = s[i++];

                if (escapeMap[ch]) {
                    result += escapeMap[ch];
                } else if (ch === 'u' || ch === 'U') {
                    const hexLength = ch === 'u' ? 4 : 8;
                    const hexCode = s.slice(i, i + hexLength);
                    result += String.fromCodePoint(parseInt(hexCode, 16));
                    i += hexLength;
                } else if (ch === 'x') {
                    const hexCode = s.slice(i, i + 2);
                    result += String.fromCharCode(parseInt(hexCode, 16));
                    i += 2
                } else if (ch >= '0' && ch <= '7') {

                    let octalCode = ch;
                    ch = s[i];
                    if (ch >= '0' && ch <= '7') {
                        octalCode += ch
                        i++
                    }
                    ch = s[i];
                    if (ch >= '0' && ch <= '7') {
                        octalCode += ch
                        i++
                    }
                    result += String.fromCharCode(parseInt(octalCode, 8));
                } else {
                    result += ch
                }
            } else {
                result += ch;
            }
        }

        return result;
    }


}