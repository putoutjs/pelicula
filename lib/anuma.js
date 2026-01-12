import {parse, Lang} from '@ast-grep/napi';
import {loadPlugins} from '@putout/engine-loader';
import {splitPlugins} from './split-plugins.js';
import {applyFix} from './fix.js';

const maybeSemi = (a) => {
    if (a.endsWith('}'))
        return a;
    
    return `${a};`;
};

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
    
    for (const {rule, message, patterns, exclude = []} of fastPlugins) {
        const excluded = new Set();
        
        for (const from of exclude) {
            const nodes = root.findAll(maybeSemi(from));
            
            for (const node of nodes) {
                excluded.add(node
                    .range()
                    .start.index);
            }
        }
        
        for (const [from, to] of patterns) {
            const nodes = root.findAll(maybeSemi(from));
            
            for (const node of nodes) {
                const {index} = node.range().start;
                
                if (excluded.has(index))
                    continue;
                
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
