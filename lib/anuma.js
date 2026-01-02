import {parse, Lang} from '@ast-grep/napi';
import {loadPlugins} from '@putout/engine-loader';
import {splitPlugins} from './split-plugins.js';

export function lint(source, overrides = {}) {
    const {
        rules,
        plugins,
        fix = true,
    } = overrides;
    
    const cargoPlugins = loadPlugins({
        rules,
        pluginNames: plugins,
    });
    
    const [fastPlugins, restPlugins] = splitPlugins(cargoPlugins);
    const ast = parse(Lang.JavaScript, source);
    
    const root = ast.root();
    const places = [];
    
    for (const {rule, message, patterns} of fastPlugins) {
        for (const [from, to] of patterns) {
            let nodes = root.findAll(`${from};\n`);
            
            if (!nodes.length)
                nodes = root.findAll(from);
            
            for (const node of nodes) {
                if (fix) {
                    const result = applyFix({
                        node,
                        from,
                        to,
                    });
                    
                    const edit = node.replace(result);
                    
                    source = root.commitEdits([edit]);
                    continue;
                }
                
                places.push(getPlace({
                    node,
                    rule: `${rule} (ast-grep)`,
                    message,
                }));
            }
        }
    }
    
    return [
        source,
        places,
        restPlugins,
    ];
}

function getPlace({rule, message, node}) {
    const position = getPosition(node);
    
    return {
        message,
        rule,
        position,
    };
}

function getPosition(node) {
    const {start} = node.range();
    
    const line = start.line + 1;
    const {column} = start;
    
    return {
        line,
        column,
    };
}

const rm$ = (a) => a.slice(1);

function getTemplateVariables(str) {
    const variables = str.match(/\$[A-Z]/g);
    
    if (!variables)
        return [];
    
    return variables.map(rm$);
}

function maybeAddSemi(to, text) {
    if (text.endsWith(';') && to)
        return `${to};`;
    
    return to;
}

function applyFix({from, to, node}) {
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
