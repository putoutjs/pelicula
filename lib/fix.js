export function applyFix({from, to, node}) {
    const templateVariables = getTemplateVariables(from);
    const text = node.text();
    let result = maybeAddSemi(to, text);
    
    for (const name of templateVariables) {
        const value = node
            .getMatch(name)
            .text();
        
        result = result.replace(`$${name}`, value);
    }
    
    return result;
}

function maybeAddSemi(to, text) {
    if (text.endsWith(';') && to)
        return `${to};`;
    
    return to;
}

const rm$ = (a) => a.slice(1);

function getTemplateVariables(str) {
    const variables = str.match(/\$[A-Z]/g);
    
    if (!variables)
        return [];
    
    return variables.map(rm$);
}
